import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface DomainInterface { domainName: string }

interface Route53StackParam extends DomainInterface { }
export class Route53Stack extends cdk.Stack {

    domainName: string
    zone: route53.HostedZone

    constructor(scope: Construct, id: string, param: Route53StackParam, props: cdk.StackProps) {
        super(scope, id, props);

        this.domainName = param.domainName;

        this.zone = new route53.HostedZone(this, `hosted-zone`, {
            zoneName: this.domainName
        });
        this.zone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    }
}


interface ACMStackParam extends DomainInterface { route53Zone: route53.HostedZone }
export class ACMStack extends cdk.Stack {

    domainName: string
    certificate: acm.Certificate

    constructor(scope: Construct, id: string, param: ACMStackParam, props: cdk.StackProps) {
        super(scope, id, props);

        this.domainName = param.domainName;

        this.certificate = new acm.Certificate(this, `certificate`, {
            domainName: this.domainName,
            subjectAlternativeNames: [`*.${this.domainName}`],
            certificateName: `${this.domainName} certificate`,
            validation: acm.CertificateValidation.fromDns(param.route53Zone)
        });
        this.certificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    }
}
