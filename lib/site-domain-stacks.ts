import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';
// import * as acm from 'aws-cdk-lib/aws-certificatemanager';

import * as I from './interfaces';

interface Route53StackParam extends I.IDomainName { }
export class Route53Stack extends cdk.Stack {

    zone: route53.HostedZone

    constructor(scope: Construct, id: string, param: Route53StackParam, props: cdk.StackProps) {
        super(scope, id, props);

        this.zone = new route53.HostedZone(this, `Hosted Zone`, {
            zoneName: param.domainName
        });
        this.zone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    }
}
