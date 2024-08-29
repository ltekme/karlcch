import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';


interface SiteContentStackParam { }

export class SiteContentStack extends cdk.Stack {

    bucket: s3.Bucket;
    bucekt_contents: s3_deploy.BucketDeployment

    constructor(scope: Construct, id: string, param: SiteContentStackParam, props?: cdk.StackProps) {
        super(scope, id, props);

        this.bucket = new s3.Bucket(this, "site-bucket", {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        this.bucekt_contents = new s3_deploy.BucketDeployment(this, 'site-bucket-content', {
            destinationBucket: this.bucket,
            sources: [s3_deploy.Source.asset(path.join(__dirname, 'site_content'))],
            extract: true
        });

    }

}