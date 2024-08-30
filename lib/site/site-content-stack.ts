import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deploy from 'aws-cdk-lib/aws-s3-deployment';
import { MotdUpdate, MotdUpdateErrorsNotifyEmails } from '../site-motd/site-motd';


interface SiteContentStackParam extends MotdUpdateErrorsNotifyEmails { }
export class SiteContentStack extends cdk.Stack {

    bucket: s3.Bucket;
    bucekt_contents: s3_deploy.BucketDeployment;

    motdUpdate: MotdUpdate;

    constructor(scope: Construct, id: string, param: SiteContentStackParam, props?: cdk.StackProps) {
        super(scope, id, props);

        this.bucket = new s3.Bucket(this, "Website Content Bucket", {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        this.bucekt_contents = new s3_deploy.BucketDeployment(this, 'Website Content Bucket - Contents', {
            destinationBucket: this.bucket,
            sources: [s3_deploy.Source.asset(path.join(__dirname, 'site_content'))],
            extract: true
        });

        this.motdUpdate = new MotdUpdate(this, {
            bucket: this.bucket,
            errorsNotifyEmails: param.errorsNotifyEmails
        });
        cdk.Tags.of(this.motdUpdate).add('Sub-Project', 'Site Motd');
    }

}