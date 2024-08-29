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
import * as sns from 'aws-cdk-lib/aws-sns';

export interface SiteMotdStackParam {
    notifyErrorsEmails: string[]
}

export class SiteMotdStack extends SubProjectStack {

    motdUpdate: lambda.Function;
    motdUpdateScheduleRule: eventbridge.Rule;
    motdUpdateLogGroup: logs.LogGroup;
    motdUpdateLogGroupErrorMetric: logs.MetricFilter;
    motdUpdateLogGroupErrorMetricAlarm: cloudwatch.Alarm;
    motdUpdateErrorSNSTopic: sns.Topic;

    // testing
    testRestAPIGateway: apigw.RestApi;

    constructor(subProject: SubProject, id: string, params: SiteMotdStackParam, props: cdk.StackProps) {
        super(subProject, id, props);

        // Lambda Function
        this.motdUpdate = new lambda.Function(this, 'motd-update-Function', {
            codeSigningConfig: new lambda.CodeSigningConfig(this, 'motd-update-CodeSigningConfig', {
                signingProfiles: [new signer.SigningProfile(this, 'motd-update-SigningProfile', {
                    platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
                })],
            }),

            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,

            handler: 'main.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),

            // environment: {
            //     MOTD_DYNAMODB_TABLE_ARN: '',
            //     FAILED_UPDATE_SNS_ARN: ''
            // }
        });

        // Lambda Function - Log group
        this.motdUpdateLogGroup = new logs.LogGroup(this, 'motd-update-Function-LogGroup', {
            logGroupName: `/aws/lambda/${this.motdUpdate.functionName}`,
            retention: logs.RetentionDays.ONE_DAY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Lambda Function - Log group - Error Metric
        this.motdUpdateLogGroupErrorMetric = new logs.MetricFilter(this, 'motd-update-Function-Error-Metric', {
            logGroup: this.motdUpdateLogGroup,
            metricNamespace: 'mots-lambda-function',
            metricName: 'mots-lambda-function-errors',
            filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'Exception', 'Traceback'),
        });

        // Lambda Function - Log group - Error Metric - SNS Topic
        this.motdUpdateErrorSNSTopic = new sns.Topic(this, 'motd-update-Function-Error-Metric-SNS-Topic');

        // Lambda Function - Log group - Error Metric - SNS Topic - Subscriptions
        params.notifyErrorsEmails.forEach((email) => {
            new sns.Subscription(this, `error-notify-sns-sub-${email.replace('.', '-')}`, {
                topic: this.motdUpdateErrorSNSTopic,
                endpoint: email,
                protocol: sns.SubscriptionProtocol.EMAIL
            });
        });

        // Lambda Function - Log group - Error Metric - Alarm
        this.motdUpdateLogGroupErrorMetricAlarm = new cloudwatch.Alarm(this, 'motd-update-Function-Error-Metric-Alarm', {
            metric: this.motdUpdateLogGroupErrorMetric.metric({
                period: cdk.Duration.seconds(30) // Period must be 10, 30 or a multiple of 60 for alarm
            }),
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 0,
            evaluationPeriods: 1,
            actionsEnabled: true,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });
        this.motdUpdateLogGroupErrorMetricAlarm.addAlarmAction(new cloudwatch_action.SnsAction(this.motdUpdateErrorSNSTopic));








        // Scheduled event
        this.motdUpdateScheduleRule = new eventbridge.Rule(this, 'motd-update-Function-Schedule-Rule', {
            schedule: eventbridge.Schedule.rate(cdk.Duration.minutes(1)),
            description: "run every minute"
        })




        // APi Gateway
        this.testRestAPIGateway = new apigw.RestApi(this, 'test-api', {
            restApiName: 'test-api-for-lambda'
        });

        // APi Gateway - Lambda Integration
        this.testRestAPIGateway.root.addMethod(
            'GET',
            new apigw.LambdaIntegration(this.motdUpdate, {
                allowTestInvoke: false,
                timeout: cdk.Duration.seconds(5),
            })
        );

    }
}