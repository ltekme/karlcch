import path = require('path');

import * as cdk from 'aws-cdk-lib';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

import { SubProject, SubProjectStack } from "../..";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';

export class SiteMotdStack extends SubProjectStack {

    motdUpdateLambdaFunction: lambda.Function;
    motdUpdateLambdaFunctionLogGroup: logs.LogGroup;
    testRestAPIGateway: apigw.RestApi;

    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject, id, props);

        // Lambda Function - Log Group
        this.motdUpdateLambdaFunctionLogGroup = new logs.LogGroup(this, 'motd-update-Function-LogGroup', {
            retention: logs.RetentionDays.THREE_DAYS,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // Lambda Function
        this.motdUpdateLambdaFunction = new lambda.Function(this, 'motd-update-Function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,

            handler: 'main.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),

            loggingFormat: lambda.LoggingFormat.TEXT,
            logGroup: this.motdUpdateLambdaFunctionLogGroup,
        });

        // APi Gateway
        this.testRestAPIGateway = new apigw.RestApi(this, 'test-api', {
            restApiName: 'test-api-for-lambda'
        });

        // APi Gateway - Lambda Integration
        this.testRestAPIGateway.root.addMethod(
            'GET',
            new apigw.LambdaIntegration(this.motdUpdateLambdaFunction, {
                allowTestInvoke: false,
                timeout: cdk.Duration.seconds(5),
            })
        );

        // APi Gateway - Lambda Integration - Permission
        // this.motdUpdateLambdaFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com', {}))

    }
}