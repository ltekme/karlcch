import path = require('path');

import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cf_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import * as I from '../interfaces'
import { env } from 'process';

export interface SiteDistributionStackParams extends I.IDomainName {
    siteBucket: s3.Bucket,
    route53ZoneID: string,
};

export class SiteDistributionStack extends cdk.Stack {

    siteDistribution: cf.Distribution;
    defualtObjectRewrite: cf.experimental.EdgeFunction;

    certificate: acm.Certificate;
    route53Zone: route53.IHostedZone;

    constructor(scope: Construct, id: string, param: SiteDistributionStackParams, props?: cdk.StackProps) {
        super(scope, id, props);

        const DEFAULT_ROOT_OBJECT = 'index.html';

        // Route53 Zones and Certificate
        this.route53Zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Imported Zone ID', {
            hostedZoneId: param.route53ZoneID,
            zoneName: param.domainName
        });
        this.certificate = new acm.Certificate(this, `Certificate`, {
            domainName: param.domainName,
            subjectAlternativeNames: [`*.${param.domainName}`],
            certificateName: `${param.domainName} certificate`,
            validation: acm.CertificateValidation.fromDns(this.route53Zone)
        });
        this.certificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        // Distribution - Trialing path root document append
        this.defualtObjectRewrite = new cf.experimental.EdgeFunction(this, 'HTTP Rewrite Default Document Fn', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'code-rewrite-lambda'))
        });

        // Distribution - Response Header
        const contentBucketBehavoiur = {
            origin: new cf_origins.S3Origin(param.siteBucket, {
                originShieldEnabled: true,
                originShieldRegion: 'us-east-1'
            }),
            cachedMethods: cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            responseHeadersPolicy: new cf.ResponseHeadersPolicy(this, 'Custom Security Response Header', {
                securityHeadersBehavior: {
                    strictTransportSecurity: {
                        override: true,
                        preload: true,
                        includeSubdomains: true,
                        accessControlMaxAge: cdk.Duration.days(730) // 2 years
                    }
                }
            }),
        }

        const motdCachePolicy = new cf.CachePolicy(this, 'Motd Chaching Policy', {
            defaultTtl: cdk.Duration.hours(1),
            maxTtl: cdk.Duration.hours(1),
            minTtl: cdk.Duration.hours(1),
        })

        const motdCutsomBehaviour = {
            ...contentBucketBehavoiur,
            cachePolicy: motdCachePolicy,
            edgeLambdas: [
                {
                    functionVersion: this.defualtObjectRewrite.currentVersion,
                    eventType: cf.LambdaEdgeEventType.ORIGIN_REQUEST
                }
            ],
        }

        // Distribution
        this.siteDistribution = new cf.Distribution(this, 'Site CloudFront Distribution', {

            defaultRootObject: DEFAULT_ROOT_OBJECT,

            defaultBehavior: contentBucketBehavoiur,

            additionalBehaviors: {
                '/motd': motdCutsomBehaviour,
                '/motd*': motdCutsomBehaviour,
                '/sitemap.xml': {
                    ...contentBucketBehavoiur,
                    cachePolicy: motdCachePolicy,
                }
            },

            domainNames: [
                param.domainName,
                `www.${param.domainName}`
            ],
            certificate: this.certificate,

            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 404,
                    responsePagePath: '/error.html',
                    ttl: cdk.Duration.days(1)
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 403,
                    responsePagePath: '/error.html',
                    ttl: cdk.Duration.days(1)
                }
            ]

        });

        // Record for Distribution
        new route53.ARecord(this, 'CloudFront Domain Alias Route 53 Record', {
            zone: this.route53Zone,
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.siteDistribution)),
            deleteExisting: true
        });

        new route53.ARecord(this, 'CloudFront Domain Alias Route 53 Record - WWW', {
            zone: this.route53Zone,
            recordName: 'www',
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.siteDistribution)),
            deleteExisting: true
        });

        // Get CloudFront Domain Name on Output
        new cdk.CfnOutput(this, 'CloudFront Distribution URL', {
            value: `https://${this.siteDistribution.domainName}`
        });

    }
}