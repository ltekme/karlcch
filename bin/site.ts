#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SiteContentStack } from "../lib/site-content-stack";
import { SiteDistributionStack } from "../lib/site-distribution-stack";
import { SiteDomainStack } from "../lib/site-domain-stacks";

const app = new cdk.App();

const siteContentStack = new SiteContentStack(app, "ltekme-SiteContentStack", {}, {
    stackName: "ltekme-SiteContentStack",
    description: "S3 static site store for ltek.me"
},);

const siteDomainStack = new SiteDomainStack(app, "ltekme-SiteDomainStack", {
    domainName: "dev-test.ltek.me"
}, {
    stackName: "ltekme-SiteDomainStack",
    description: "Master Stack for ltek.me domain"
});

const siteDistributionStack = new SiteDistributionStack(app, "ltekme-SiteDistributionStack", {
    domainName: "dev-test.ltek.me",
    siteBucket: siteContentStack.bucket,
    acmCertificate: siteDomainStack.siteDomain_ACM_Stack.certificate,
    route53Zone: siteDomainStack.siteDomain_Route53_Stack.zone
}, {
    stackName: "ltekme-SiteDistributionStack",
    description: "CloudFront Distribution for ltek.me"
},);


siteDistributionStack.addDependency(siteContentStack);
siteDistributionStack.addDependency(siteDomainStack);

app.synth();