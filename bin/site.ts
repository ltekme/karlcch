#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Config } from './site-config';

import * as site from "../lib/site/site";
import * as site_domain from '../lib/site-domain-stacks'

const app = new cdk.App();
const config = new Config();

// Tag all resource
cdk.Tags.of(app).add("Created-by", "CDK_CloudFormation");
cdk.Tags.of(app).add("Project", config.projectName);


const siteDomain_Route53_Stack = new site_domain.Route53Stack(app, `${config.projectName}-SiteDomain-Route53-Stack`, {
    domainName: config.domainName
}, {
    stackName: `${config.projectName}-SiteDomain-Route53-Stack`,
    description: `${config.domainName} route53 Hosted Zone`,
    env: { // Set Region For CloudFront Lambda @ Edge
        region: config.region,
    }
});


const siteContentStack = new site.SiteContentStack(app, `${config.projectName}-SiteContentStack`, {
    route53ZoneID: siteDomain_Route53_Stack.zone.hostedZoneId,
    errorsNotifyEmails: config.motdSubProjectNotifyEmails,
    domainName: config.domainName,
}, {
    stackName: `${config.projectName}-SiteContentStack`,
    description: `S3 static site store for ${config.domainName}`,
    env: { // Set Region For CloudFront Lambda @ Edge
        region: config.region,
    }
});


app.synth();