#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiteContentStack } from '../lib/site-content-stack';
import { SiteDistStack } from '../lib/site-dist-stack';
import { Scope } from 'aws-cdk-lib/aws-ecs';

const app = new cdk.App();

const siteContentStack = new SiteContentStack(app, 'SiteStack', {
    stackName: "Ltekme-website-content-stor",
    description: "S3 static site store for ltek.me"
});

const SiteDistributionStack = new SiteDistStack(app, 'SiteDistributionStack', siteContentStack.bucket, {
    stackName: "Ltekme-website-content-dist",
    description: "CloudFront Distribution for ltek.me"
});

app.synth();