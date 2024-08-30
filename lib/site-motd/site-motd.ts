import path = require('path');

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
import { Construct } from 'constructs';

export interface MotdUpdateErrorsNotifyEmails {
    errorsNotifyEmails: string[]
}

export interface MotdUpdateParam extends MotdUpdateErrorsNotifyEmails {
    bucket: s3.Bucket
}

export class MotdUpdate extends Construct {

    // motd update
    lambdaFunction: lambda.Function;
    lambdaFunctionScheduleRule: eventbridge.Rule;
    lambdaFunctionLogGroup: logs.LogGroup;
    lambdaFunctionLogGroupErrorMetric: logs.MetricFilter;
    lambdaFunctionLogGroupErrorMetricAlarm: cloudwatch.Alarm;
    lambdaFunctionErrorSNSTopic: sns.Topic;

    // testing
    testRestAPIGateway: apigw.RestApi;

    constructor(scope: cdk.Stack, param: MotdUpdateParam) {
        super(scope, 'motd-project');

        // Lambda Function
        this.lambdaFunction = new lambda.Function(scope, 'Motd Update Lambda Function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.minutes(0.5),
            handler: 'main.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),
            environment: {
                MOTD_CONTENT_BUCKET: param.bucket.bucketName
            },
        });

        // Lambda Function - Invoke Bedrock Permission
        this.lambdaFunction.role?.attachInlinePolicy(new iam.Policy(scope, 'Lambda Function Permission', {
            policyName: "allow-bedrock-invoke",
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["bedrock:InvokeModel"],
                    resources: [`arn:aws:bedrock:${scope.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`]
                }),
            ],
        }));

        // Lambda Function - Bucket Policy
        param.bucket.addToResourcePolicy(new iam.PolicyStatement({
            principals: [new iam.ArnPrincipal(this.lambdaFunction.role?.roleArn!)],
            effect: iam.Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [`${param.bucket.bucketArn}/motd/index.html`]
        }));

        // Lambda Function - Log group
        this.lambdaFunctionLogGroup = new logs.LogGroup(scope, 'Lambda Function Log Group', {
            logGroupName: `/aws/lambda/${this.lambdaFunction.functionName}`,
            retention: logs.RetentionDays.ONE_DAY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Lambda Function - Log group - Error Metric
        this.lambdaFunctionLogGroupErrorMetric = new logs.MetricFilter(scope, 'Lambda Function Error Metric', {
            logGroup: this.lambdaFunctionLogGroup,
            metricNamespace: 'motd-lambda-function',
            metricName: 'motd-lambda-function-errors',
            filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'Exception', 'Traceback', 'Status: timeout'),
        });

        // Lambda Function - Log group - Error Metric - SNS Topic
        this.lambdaFunctionErrorSNSTopic = new sns.Topic(scope, 'Lambda Function Errors Notification SNS Topic');

        // Lambda Function - Log group - Error Metric - SNS Topic - Subscriptions
        param.errorsNotifyEmails.forEach((email) => {
            new sns.Subscription(scope, `Lambda Function Errors ${email} Subscriber`, {
                topic: this.lambdaFunctionErrorSNSTopic,
                endpoint: email,
                protocol: sns.SubscriptionProtocol.EMAIL
            });
        });

        // Lambda Function - Log group - Error Metric - Alarm
        this.lambdaFunctionLogGroupErrorMetricAlarm = new cloudwatch.Alarm(scope, 'Lambda Function Error Metric Alarm', {
            metric: this.lambdaFunctionLogGroupErrorMetric.metric({
                period: cdk.Duration.minutes(1) // Period must be 10, 30 or a multiple of 60 for alarm
            }),
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 0,
            evaluationPeriods: 1,
            actionsEnabled: true,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });
        this.lambdaFunctionLogGroupErrorMetricAlarm.addAlarmAction(new cloudwatch_action.SnsAction(this.lambdaFunctionErrorSNSTopic));

        // Scheduled event
        this.lambdaFunctionScheduleRule = new eventbridge.Rule(scope, 'Scheduled Lambda Execution Rule', {
            schedule: eventbridge.Schedule.rate(cdk.Duration.minutes(5)),
            description: "schedule for motd update lambda function",
            targets: [new eventbridge_targets.LambdaFunction(this.lambdaFunction, {
                retryAttempts: 2
            })]
        });

        // APi Gateway
        this.testRestAPIGateway = new apigw.RestApi(scope, 'Test Execute Lambda API', {
            restApiName: 'test-api-for-lambda'
        });

        // APi Gateway - Lambda Integration
        this.testRestAPIGateway.root.addMethod(
            'GET',
            new apigw.LambdaIntegration(this.lambdaFunction, {
                allowTestInvoke: false,
                timeout: cdk.Duration.seconds(5),
            })
        );

    }
}



