import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Bucket } from 'aws-cdk-lib/aws-s3';

import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class SiteDistStack extends cdk.Stack {

    _distribution: Distribution;

    constructor(scope: Construct, id: string, siteContentBucket: Bucket, props?: cdk.StackProps) {
        super(scope, id, props);

        this._distribution = new Distribution(this, "ltekme-site", {
            defaultBehavior: { origin: new S3Origin(siteContentBucket) },
        })

    }

    get cloudFrontDistribution() {
        return this._distribution
    }

}