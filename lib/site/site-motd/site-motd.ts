import path = require('path');

import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventbridge from 'aws-cdk-lib/aws-events';
// import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as eventbridge_targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch_action from 'aws-cdk-lib/aws-cloudwatch-actions';

import * as I from '../../interfaces'

export interface MotdUpdateParam extends I.MotdUpdateErrorsNotifyEmails, I.IDomainName, I.SiteBucket { }

export class MotdUpdate {

    // motd update
    lambdaFunction: lambda.Function;
    lambdaFunctionScheduleRule: eventbridge.Rule;
    lambdaFunctionLogGroup: logs.LogGroup;
    lambdaFunctionLogGroupErrorMetric: logs.MetricFilter;
    lambdaFunctionLogGroupErrorMetricAlarm: cloudwatch.Alarm;
    lambdaFunctionErrorSNSTopic: sns.Topic;

    // testing
    // testRestAPIGateway: apigw.RestApi;

    constructor(scope: cdk.Stack, param: MotdUpdateParam) {


        this.lambdaFunction = new lambda.Function(scope, 'Motd Update Lambda Function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            handler: 'main.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "motd_update_lambda")),
            environment: {
                MOTD_CONTENT_BUCKET: param.siteBucket.bucketName,
                DOMAIN_NAME: param.domainName
            },
        });


        this.lambdaFunction.role?.attachInlinePolicy!(new iam.Policy(scope, 'Lambda Function Permission', {
            policyName: "allow-bedrock-invoke",
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["bedrock:InvokeModel"],
                    resources: [`arn:aws:bedrock:${scope.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`]
                }),
            ],
        }));


        param.siteBucket.addToResourcePolicy(new iam.PolicyStatement({
            principals: [new iam.ArnPrincipal(this.lambdaFunction.role?.roleArn!)],
            effect: iam.Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [
                `${param.siteBucket.bucketArn}/motd/index.html`,
                `${param.siteBucket.bucketArn}/sitemap.xml`
            ]
        }));


        this.lambdaFunctionLogGroup = new logs.LogGroup(scope, 'Lambda Function Log Group', {
            logGroupName: `/aws/lambda/${this.lambdaFunction.functionName}`,
            retention: logs.RetentionDays.ONE_DAY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });


        this.lambdaFunctionLogGroupErrorMetric = new logs.MetricFilter(scope, 'Lambda Function Error Metric', {
            logGroup: this.lambdaFunctionLogGroup,
            metricNamespace: 'motd-lambda-function',
            metricName: 'motd-lambda-function-errors',
            filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'Exception', 'Traceback', 'Status: timeout'),
        });


        this.lambdaFunctionErrorSNSTopic = new sns.Topic(scope, 'Lambda Function Errors Notification SNS Topic');


        param.errorsNotifyEmails.forEach((email) => {
            new sns.Subscription(scope, `Lambda Function Errors ${email} Subscriber`, {
                topic: this.lambdaFunctionErrorSNSTopic,
                endpoint: email,
                protocol: sns.SubscriptionProtocol.EMAIL
            });
        });


        this.lambdaFunctionLogGroupErrorMetricAlarm = new cloudwatch.Alarm(scope, 'Lambda Function Error Metric Alarm', {
            metric: this.lambdaFunctionLogGroupErrorMetric.metric({
                period: cdk.Duration.seconds(10) // Period must be 10, 30 or a multiple of 60 for alarm
            }),
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 0,
            evaluationPeriods: 1,
            actionsEnabled: true,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });
        this.lambdaFunctionLogGroupErrorMetricAlarm.addAlarmAction(new cloudwatch_action.SnsAction(this.lambdaFunctionErrorSNSTopic));


        this.lambdaFunctionScheduleRule = new eventbridge.Rule(scope, 'Scheduled Lambda Execution Rule', {
            schedule: eventbridge.Schedule.rate(cdk.Duration.hours(1)),
            description: "schedule for motd update lambda function",
            targets: [new eventbridge_targets.LambdaFunction(this.lambdaFunction, {
                retryAttempts: 2
            })]
        });


        // this.testRestAPIGateway = new apigw.RestApi(scope, 'Test Execute Lambda API', {
        //     restApiName: 'test-api-for-lambda'
        // });


        // this.testRestAPIGateway.root.addMethod(
        //     'GET',
        //     new apigw.LambdaIntegration(this.lambdaFunction, {
        //         allowTestInvoke: false,
        //         timeout: cdk.Duration.seconds(29),
        //     })
        // );

    }
}



