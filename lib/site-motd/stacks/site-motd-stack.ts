import path = require('path');

import { SubProject, SubProjectStack } from "../..";

import * as cdk from 'aws-cdk-lib';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as eventbridge from 'aws-cdk-lib/aws-events';


export class SiteMotdStack extends SubProjectStack {

    motdUpdate: lambda.Function;
    motdUpdateLogGroup: logs.LogGroup;
    motdUpdateScheduleRule: eventbridge.Rule

    // testing
    testRestAPIGateway: apigw.RestApi;

    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject, id, props);

        // Lambda Function - Log Group
        this.motdUpdateLogGroup = new logs.LogGroup(this, 'motd-update-Function-LogGroup', {
            retention: logs.RetentionDays.THREE_DAYS,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
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

            loggingFormat: lambda.LoggingFormat.TEXT,
            logGroup: this.motdUpdateLogGroup,
        });

        // Scheduled event
        // this.motdUpdateSchedule = new eventbridge.Schedule(this, 'motd-update-Function-Schedule', {
        //     scheduler: new ScheduleExpression
        // })

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