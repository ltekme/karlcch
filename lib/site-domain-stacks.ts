import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface Domain { domainName: string }

interface SiteDomain_Route53_StackParam extends Domain { }
export class SiteDomain_Route53_Stack extends cdk.NestedStack {

    domainName: string
    zone: route53.HostedZone

    constructor(scope: Construct, id: string, param: SiteDomain_Route53_StackParam, props: cdk.NestedStackProps) {
        super(scope, id, props);

        this.domainName = param.domainName;

        this.zone = new route53.HostedZone(this, `${this.domainName.replace('.', '-')}-route53`, {
            zoneName: this.domainName
        });

    }
}


interface SiteDomain_ACM_StackParam extends Domain { route53Zone: route53.HostedZone }
export class SiteDomain_ACM_Stack extends cdk.NestedStack {

    domainName: string
    certificate: acm.Certificate

    constructor(scope: Construct, id: string, param: SiteDomain_ACM_StackParam, props: cdk.NestedStackProps) {
        super(scope, id, props);

        this.domainName = param.domainName;

        this.certificate = new acm.Certificate(this, `${this.domainName.replace('.', '-')}-acm`, {
            domainName: this.domainName,
            subjectAlternativeNames: [`*.${this.domainName}`],
            certificateName: `${this.domainName} certificate`,
            validation: acm.CertificateValidation.fromDns(param.route53Zone)
        });

    }
}


interface SiteDomainStackParam extends Domain { }
export class SiteDomainStack extends cdk.Stack {

    siteDomain_Route53_Stack: SiteDomain_Route53_Stack
    siteDomain_ACM_Stack: SiteDomain_ACM_Stack

    domainName: string

    constructor(scope: Construct, id: string, param: SiteDomainStackParam, props: cdk.StackProps) {
        super(scope, id, props);

        this.domainName = param.domainName

        this.siteDomain_Route53_Stack = new SiteDomain_Route53_Stack(this, `${id}-Route53`, {
            domainName: this.domainName
        }, {
            description: `child stack for ${this.domainName} route53 Hosted Zone`,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.siteDomain_ACM_Stack = new SiteDomain_ACM_Stack(this, `${id}-ACM`, {
            domainName: this.domainName,
            route53Zone: this.siteDomain_Route53_Stack.zone
        }, {
            description: `child stack for ${this.domainName} ACM`,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.siteDomain_ACM_Stack.addDependency(this.siteDomain_Route53_Stack);
    }
}
