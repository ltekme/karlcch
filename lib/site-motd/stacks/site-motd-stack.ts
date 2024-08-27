import path = require('path');

import * as cdk from 'aws-cdk-lib';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { SubProject, SubProjectStack } from "../..";

export class SiteMotdStack extends SubProjectStack {

    motdUpdateLambdaFunction: lambda.Function;

    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject, id, props);

        this.motdUpdateLambdaFunction = new lambda.Function(this, 'motd-update-Function', {
            codeSigningConfig: new lambda.CodeSigningConfig(this, 'motd-update-CodeSigningConfig', {
                signingProfiles: [new signer.SigningProfile(this, 'motd-update-SigningProfile', {
                    platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
                })],
            }),
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, "code-motd-update-lambda")),
        });


    }
}