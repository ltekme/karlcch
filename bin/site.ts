#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Config } from './site-config';

import { SiteContentStack } from "../lib/site/site-content-stack";
import { SiteDistributionStack } from "../lib/site/site-distribution-stack";
import * as siteDomain from '../lib/site/site-domain-stacks'

const app = new cdk.App();
const config = new Config();

// Tag all resource
cdk.Tags.of(app).add("Created-by", "CDK_CloudFormation");
cdk.Tags.of(app).add("Project", config.projectName);


const siteContentStack = new SiteContentStack(app, `${config.projectName}-SiteContentStack`, {
    errorsNotifyEmails: config.motdSubProjectNotifyEmails,
    domainName: config.domainName
}, {
    stackName: `${config.projectName}-SiteContentStack`,
    description: `S3 static site store for ${config.domainName}`,
    env: { // Set Region For CloudFront Lambda @ Edge
        region: config.region,
    }
});


const siteDomain_Route53_Stack = new siteDomain.Route53Stack(app, `${config.projectName}-SiteDomain-Route53-Stack`, {
    domainName: config.domainName
}, {
    stackName: `${config.projectName}-SiteDomain-Route53-Stack`,
    description: `${config.domainName} route53 Hosted Zone`,
    env: { // Set Region For CloudFront Lambda @ Edge
        region: config.region,
    }
});


const siteDistributionStack = new SiteDistributionStack(app, `${config.projectName}-SiteDistributionStack`, {
    domainName: config.domainName,
    siteBucket: siteContentStack.bucket,
    route53ZoneID: siteDomain_Route53_Stack.zone.hostedZoneId
}, {
    stackName: `${config.projectName}-SiteDistributionStack`,
    description: `CloudFront Distribution for ${config.domainName}`,
    env: { // Set Region For CloudFront Lambda @ Edge
        region: config.region,
    }
});


app.synth();