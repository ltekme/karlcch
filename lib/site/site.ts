import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as motd from './site-motd/site-motd';
import * as dist from './site-dist/site-dist';

import * as I from '../interfaces';

export interface SiteContentStackParam extends I.MotdUpdateErrorsNotifyEmails, I.IDomainName, I.Route53ZoneID { };

export class SiteStack extends cdk.Stack {

    bucket: s3.Bucket;
    bucektDeployment: s3_deploy.BucketDeployment;
    bucketDistribution: dist.SiteDistribution;
    motdUpdate: motd.MotdUpdate;


    constructor(scope: Construct, id: string, param: SiteContentStackParam, props?: cdk.StackProps) {
        super(scope, id, props);

        this.bucket = new s3.Bucket(this, "Website Content Bucket", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: true,
        });

        this.bucektDeployment = new s3_deploy.BucketDeployment(this, 'Website Content Bucket - Contents', {
            sources: [s3_deploy.Source.asset(path.join(__dirname, 'site_content'))],
            destinationBucket: this.bucket,
            extract: true,
        });

        this.bucketDistribution = new dist.SiteDistribution(this, 'Website Content DIstribution', {
            route53ZoneID: param.route53ZoneID,
            domainName: param.domainName,
            siteBucket: this.bucket,
        });

        this.motdUpdate = new motd.MotdUpdate(this, {
            errorsNotifyEmails: param.errorsNotifyEmails,
            domainName: param.domainName,
            siteBucket: this.bucket,
        });


    }

}