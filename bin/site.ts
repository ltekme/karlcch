#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Config } from './site-config';
import { SiteContentStack } from "../lib/root/site-content-stack";
import { SiteDistributionStack } from "../lib/root/site-distribution-stack";
import * as siteDomain from '../lib/root/site-domain-stacks'

const app = new cdk.App();
const config = new Config();

// Tag all resource
cdk.Tags.of(app).add("Created by", "CDK_CloudFormation");
cdk.Tags.of(app).add("Project", config.projectName);

const siteContentStack = new SiteContentStack(app, `${config.projectName}-SiteContentStack`, {}, {
    stackName: `${config.projectName}-SiteContentStack`,
    description: `S3 static site store for ${config.domainName}`
},);


const siteDomain_Route53_Stack = new siteDomain.Route53Stack(app, `${config.projectName}-SiteDomain-Route53-Stack`, {
    domainName: config.domainName
}, {
    stackName: `${config.projectName}-SiteDomain-Route53-Stack`,
    description: `${config.domainName} route53 Hosted Zone`,
});


const siteDomain_ACM_Stack = new siteDomain.ACMStack(app, `${config.projectName}-SiteDomain-ACM-Stack`, {
    domainName: config.domainName,
    route53Zone: siteDomain_Route53_Stack.zone
}, {
    stackName: `${config.projectName}-SiteDomain-ACM-Stack`,
    description: `${config.domainName} ACM Certificate`,
});
siteDomain_ACM_Stack.addDependency(siteDomain_Route53_Stack);


const siteDistributionStack = new SiteDistributionStack(app, `${config.projectName}-SiteDistributionStack`, {
    domainName: config.domainName,
    siteBucket: siteContentStack.bucket,
    acmCertificate: siteDomain_ACM_Stack.certificate,
    route53Zone: siteDomain_Route53_Stack.zone
}, {
    stackName: `${config.projectName}-SiteDistributionStack`,
    description: `CloudFront Distribution for ${config.domainName}`
},);
siteDistributionStack.addDependency(siteContentStack);
siteDistributionStack.addDependency(siteDomain_Route53_Stack);
siteDistributionStack.addDependency(siteDomain_ACM_Stack);


app.synth();