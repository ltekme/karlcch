import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export class SiteContentStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const site_content_bucket: Bucket = new Bucket(this, "ltekme-site", {
            versioned: true,
            removalPolicy: RemovalPolicy.DESTROY
        });

        new cdk.CfnOutput(this, 'site-content-bucket-arn', {
            value: site_content_bucket.bucketArn,
            exportName: "ltekme-site-content-bucket-arn",
            description: "ltekme Site Content Bucket ARN"
        });

    }
}