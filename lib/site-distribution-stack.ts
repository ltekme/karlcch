import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cf_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';

interface SiteDistributionStackParams {
    siteBucket: s3.Bucket,
    acmCertificate: acm.Certificate,
    route53Zone: route53.HostedZone,
    domainName: string
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
            defaultRootObject: 'index.html',
            domainNames: [`www.${param.domainName}`, param.domainName],
            certificate: param.acmCertificate
        });

        new route53.ARecord(this, 'site-dist-domain-record', {
            zone: param.route53Zone,
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.siteDistribution))
        });

        new route53.ARecord(this, 'site-dist-domain-record-www', {
            zone: param.route53Zone,
            recordName: 'www',
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.siteDistribution))
        });

        new cdk.CfnOutput(this, 'site-distribution-domain', {
            value: this.siteDistribution.domainName
        });

    }
}