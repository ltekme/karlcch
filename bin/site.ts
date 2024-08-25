#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiteContentStack } from '../lib/site-content-stack';
import { SiteDistStack } from '../lib/site-dist-stack';

const app = new cdk.App();

const siteContentStack = new SiteContentStack(app, 'ltekme-SiteContentStack', {
    description: "S3 static site store for ltek.me"
});

const siteDistributionStack = new SiteDistStack(app, 'ltekme-SiteDistributionStack', {
    description: "CloudFront Distribution for ltek.me"
});

app.synth();