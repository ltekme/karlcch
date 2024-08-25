import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cf_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SiteDistStack extends cdk.Stack {

    site_bucket: s3.IBucket;
    site_bucket_arn: string
    site_bucket_oai: cf.OriginAccessIdentity;
    site_bucket_policy: s3.BucketPolicy;

    site_distribution: cf.Distribution

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // import bucket
        this.site_bucket_arn = cdk.Fn.importValue("ltekme-site-content-bucket-arn");
        this.site_bucket = s3.Bucket.fromBucketArn(this, "import-bucket", this.site_bucket_arn);

        // setup OAI
        this.site_bucket_oai = new cf.OriginAccessIdentity(this, 'oai-for-site-bucket', {
            comment: "OAI for site content bucket"
        })

        // bucket policy for oai
        this.site_bucket_policy = new s3.BucketPolicy(this, 'bucket-policy-for-oai', {
            bucket: this.site_bucket,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        this.site_bucket_policy.document.addStatements(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["s3:GetObject"],
                principals: [this.site_bucket_oai.grantPrincipal],
                resources: [`${this.site_bucket_arn}/*`]
            })
        );

        // create distribution
        this.site_distribution = new cf.Distribution(this, "ltekme-site", {
            defaultBehavior: {
                origin: new cf_origins.S3Origin(this.site_bucket, {
                    originAccessIdentity: this.site_bucket_oai,
                    originShieldEnabled: true,
                    originShieldRegion: "us-east-1"
                })
            },
            defaultRootObject: "index.html"
        });

    }
}