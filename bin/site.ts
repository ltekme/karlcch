#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SiteContentStack } from "../lib/site-content-stack";
import { SiteDistributionStack } from "../lib/site-distribution-stack";

const app = new cdk.App();

const siteContentStack = new SiteContentStack(app, "ltekme-SiteContentStack", {}, {
    stackName: "ltekme-SiteContentStack",
    description: "S3 static site store for ltek.me"
},);

const siteDistributionStack = new SiteDistributionStack(app, "ltekme-SiteDistributionStack", {
    siteBucket: siteContentStack.bucket
}, {
    stackName: "ltekme-SiteDistributionStack",
    description: "CloudFront Distribution for ltek.me"
},);

app.synth();