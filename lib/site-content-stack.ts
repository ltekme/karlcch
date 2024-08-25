import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';


import * as s3 from 'aws-cdk-lib/aws-s3';



export class SiteContentStack extends cdk.Stack {

    readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.bucket = new s3.Bucket(this, "ltekme-site", {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        new cdk.CfnOutput(this, 'site-content-bucket-arn', {
            value: this.bucket.bucketArn,
            exportName: "ltekme-site-content-bucket-arn",
            description: "ltekme Site Content Bucket ARN"
        });

    }

}