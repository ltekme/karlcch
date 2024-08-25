import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cf_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

interface SiteDistributionStackParams {
    siteBucket: s3.Bucket
}

export class SiteDistributionStack extends cdk.Stack {

    siteDistribution: cf.Distribution
    siteBucketOrigin: cf_origins.S3Origin

    constructor(scope: Construct, id: string, param: SiteDistributionStackParams, props?: cdk.StackProps) {
        super(scope, id, props);

        // distribution
        this.siteBucketOrigin = new cf_origins.S3Origin(param.siteBucket, {
            originShieldEnabled: true,
            originShieldRegion: 'us-east-1'
        });
        this.siteDistribution = new cf.Distribution(this, 'site-distribution', {
            defaultBehavior: { origin: this.siteBucketOrigin },
            defaultRootObject: 'index.html'
        });

        new cdk.CfnOutput(this, 'site-distribution-domain', {
            value: this.siteDistribution.domainName
        })

    }
}