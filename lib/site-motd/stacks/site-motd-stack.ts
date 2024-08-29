import path = require('path');

import { SubProject, SubProjectStack } from "../..";

import * as cdk from 'aws-cdk-lib';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_action from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as eventbridge from 'aws-cdk-lib/aws-events';
import * as eventbridge_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { OAuthScope } from 'aws-cdk-lib/aws-cognito';

export interface SiteMotdStackParam {
    notifyErrorsEmails: string[],
    motdPageBucket: s3.Bucket,
}

export class SiteMotdStack extends SubProjectStack {

    motdUpdateLambda: lambda.Function;
    motdUpdateLambdaScheduleRule: eventbridge.Rule;
    motdUpdateLambdaLogGroup: logs.LogGroup;
    motdUpdateLambdaLogGroupErrorMetric: logs.MetricFilter;
    motdUpdateLambdaLogGroupErrorMetricAlarm: cloudwatch.Alarm;
    motdUpdateLambdaErrorSNSTopic: sns.Topic;

    // testing
    testRestAPIGateway: apigw.RestApi;

    constructor(subProject: SubProject, id: string, params: SiteMotdStackParam, props: cdk.StackProps) {
        super(subProject, id, props);

        // Lambda Function
        this.motdUpdateLambda = new lambda.Function(this, 'motd-update-Function', {
            codeSigningConfig: new lambda.CodeSigningConfig(this, 'motd-update-CodeSigningConfig', {
                signingProfiles: [new signer.SigningProfile(this, 'motd-update-SigningProfile', {
                    platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
                })],
            }),

            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.minutes(0.5),

            handler: 'main.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),

            environment: {
                MOTD_CONTENT_BUCKET: params.motdPageBucket.bucketName
            },

        });

        // Lambda Function - Invoke Bedrock Permission
        this.motdUpdateLambda.role?.attachInlinePolicy(new iam.Policy(this, 'motd-update-Function-bedrock-permission', {
            policyName: "allow-bedrock-invoke",
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["bedrock:InvokeModel"],
                    resources: [`arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`]
                }),
            ],
        }));

        // Lambda Function - Bucket Permission
        this.motdUpdateLambda.role?.attachInlinePolicy(new iam.Policy(this, 'motd-update-Function-bucket-permission', {
            policyName: 'allow-bucket-write',
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:PutObject'],
                    resources: [`${params.motdPageBucket.bucketArn}/motd/index.html`]
                }),
            ],
        }));

        // Lambda Function - Bucket Policy
        // new object to work around dependency issue
        new s3.BucketPolicy(this, 'motd-site-content-bucket-policy', {
            bucket: params.motdPageBucket
        }).document.addStatements(new iam.PolicyStatement({
            principals: [new iam.ArnPrincipal(this.motdUpdateLambda.role?.roleArn!)],
            effect: iam.Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [`${params.motdPageBucket.bucketArn}/motd/index.html`]
        }));

        // Lambda Function - Log group
        this.motdUpdateLambdaLogGroup = new logs.LogGroup(this, 'motd-update-Function-LogGroup', {
            logGroupName: `/aws/lambda/${this.motdUpdateLambda.functionName}`,
            retention: logs.RetentionDays.ONE_DAY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Lambda Function - Log group - Error Metric
        this.motdUpdateLambdaLogGroupErrorMetric = new logs.MetricFilter(this, 'motd-update-Function-Error-Metric', {
            logGroup: this.motdUpdateLambdaLogGroup,
            metricNamespace: 'mots-lambda-function',
            metricName: 'mots-lambda-function-errors',
            filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'Exception', 'Traceback', 'Status: timeout'),
        });

        // Lambda Function - Log group - Error Metric - SNS Topic
        this.motdUpdateLambdaErrorSNSTopic = new sns.Topic(this, 'motd-update-Function-Error-Metric-SNS-Topic');

        // Lambda Function - Log group - Error Metric - SNS Topic - Subscriptions
        params.notifyErrorsEmails.forEach((email) => {
            new sns.Subscription(this, `error-notify-sns-sub-${email.replace('.', '-')}`, {
                topic: this.motdUpdateLambdaErrorSNSTopic,
                endpoint: email,
                protocol: sns.SubscriptionProtocol.EMAIL
            });
        });

        // Lambda Function - Log group - Error Metric - Alarm
        this.motdUpdateLambdaLogGroupErrorMetricAlarm = new cloudwatch.Alarm(this, 'motd-update-Function-Error-Metric-Alarm', {
            metric: this.motdUpdateLambdaLogGroupErrorMetric.metric({
                period: cdk.Duration.minutes(1) // Period must be 10, 30 or a multiple of 60 for alarm
            }),
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 0,
            evaluationPeriods: 1,
            actionsEnabled: true,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });
        this.motdUpdateLambdaLogGroupErrorMetricAlarm.addAlarmAction(new cloudwatch_action.SnsAction(this.motdUpdateLambdaErrorSNSTopic));

        // Scheduled event
        this.motdUpdateLambdaScheduleRule = new eventbridge.Rule(this, 'motd-update-Function-Schedule-Rule', {
            schedule: eventbridge.Schedule.rate(cdk.Duration.days(1)),
            description: "schedule for motd update lambda function",
            targets: [new eventbridge_targets.LambdaFunction(this.motdUpdateLambda, {
                retryAttempts: 2
            })]
        });







        // APi Gateway
        this.testRestAPIGateway = new apigw.RestApi(this, 'test-api', {
            restApiName: 'test-api-for-lambda'
        });

        // APi Gateway - Lambda Integration
        this.testRestAPIGateway.root.addMethod(
            'GET',
            new apigw.LambdaIntegration(this.motdUpdateLambda, {
                allowTestInvoke: false,
                timeout: cdk.Duration.seconds(5),
            })
        );

    }
}