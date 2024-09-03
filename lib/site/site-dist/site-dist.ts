import path = require('path');

import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cf_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import * as I from '../../interfaces';

export interface SiteDistributionParams extends I.IDomainName, I.Route53ZoneID, I.SiteBucket { };

export class SiteDistribution {

    distribution: cf.Distribution;
    route53HostedZone: route53.IHostedZone;
    acmCertificate: acm.Certificate;
    httpDefualtObjectRewrite: cf.experimental.EdgeFunction;

    constructor(scope: Construct, id: string, param: SiteDistributionParams) {

        // Route53 Zones and Certificate
        this.route53HostedZone = route53.HostedZone.fromHostedZoneAttributes(scope, 'Imported Zone ID', {
            hostedZoneId: param.route53ZoneID,
            zoneName: param.domainName
        });
        this.acmCertificate = new acm.Certificate(scope, `Certificate`, {
            domainName: param.domainName,
            subjectAlternativeNames: [`*.${param.domainName}`],
            certificateName: `${param.domainName} certificate`,
            validation: acm.CertificateValidation.fromDns(this.route53HostedZone)
        });
        this.acmCertificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        // Distribution - Trialing path root document append
        this.httpDefualtObjectRewrite = new cf.experimental.EdgeFunction(scope, 'HTTP Rewrite Default Document Fn', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'http_url_rewrite_lambda'))
        });

        // Distribution - Response Header
        const contentBucketBehavoiur = {
            origin: new cf_origins.S3Origin(param.siteBucket, {
                originShieldEnabled: true,
                originShieldRegion: 'us-east-1'
            }),
            cachedMethods: cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            responseHeadersPolicy: new cf.ResponseHeadersPolicy(scope, 'Custom Security Response Header', {
                securityHeadersBehavior: {
                    strictTransportSecurity: {
                        override: true,
                        preload: true,
                        includeSubdomains: true,
                        accessControlMaxAge: cdk.Duration.days(730) // 2 years
                    }
                }
            }),
        };

        const motdCachePolicy = new cf.CachePolicy(scope, 'Motd Chaching Policy', {
            defaultTtl: cdk.Duration.hours(1),
            maxTtl: cdk.Duration.hours(1),
            minTtl: cdk.Duration.hours(1),
        });

        const motdCutsomBehaviour = {
            ...contentBucketBehavoiur,
            cachePolicy: motdCachePolicy,
            edgeLambdas: [
                {
                    functionVersion: this.httpDefualtObjectRewrite.currentVersion,
                    eventType: cf.LambdaEdgeEventType.ORIGIN_REQUEST
                }
            ],
        };

        // Distribution
        this.distribution = new cf.Distribution(scope, 'Site CloudFront Distribution', {

            defaultRootObject: 'index.html',

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
            certificate: this.acmCertificate,

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
        new route53.ARecord(scope, 'CloudFront Domain Alias Route 53 Record', {
            zone: this.route53HostedZone,
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.distribution)),
            deleteExisting: true
        });

        new route53.ARecord(scope, 'CloudFront Domain Alias Route 53 Record - WWW', {
            zone: this.route53HostedZone,
            recordName: 'www',
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.distribution)),
            deleteExisting: true
        });

        // Get CloudFront Domain Name on Output
        new cdk.CfnOutput(scope, 'CloudFront Distribution URL', {
            value: `https://${this.distribution.domainName}`
        });

    }

}