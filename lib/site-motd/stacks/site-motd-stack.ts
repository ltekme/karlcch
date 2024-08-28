import path = require('path');

import * as cdk from 'aws-cdk-lib';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

import { SubProject, SubProjectStack } from "../..";
import * as logs from 'aws-cdk-lib/aws-logs';

export class SiteMotdStack extends SubProjectStack {

    motdUpdateLambdaFunction: lambda.Function;
    motdUpdateLambdaFunctionLogGroup: logs.LogGroup;
    testRestAPIGateway: apigw.RestApi;

    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject, id, props);

        this.motdUpdateLambdaFunctionLogGroup = new logs.LogGroup(this, 'motd-update-Function-LogGroup', {
            logGroupName: '/aws/lambda/site-motd-update-Function',
            retention: logs.RetentionDays.THREE_DAYS
        });
        this.motdUpdateLambdaFunction = new lambda.Function(this, 'motd-update-Function', {
            functionName: 'site-motd-update-Function',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),
            logGroup: this.motdUpdateLambdaFunctionLogGroup
        });
        this.motdUpdateLambdaFunction.role?.attachInlinePolicy(new iam.Policy(this, 'motd-update-function-cloudwatch-permission', {
            statements: [
                new iam.PolicyStatement({
                    actions: ["logs:PutLogEvents", "logs:CreateLogStream"],
                    resources: [`${this.motdUpdateLambdaFunctionLogGroup.logGroupArn}/*`]
                })
            ]
        }));


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