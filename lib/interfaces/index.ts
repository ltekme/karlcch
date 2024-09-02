import * as s3 from 'aws-cdk-lib/aws-s3';

export interface IDomainName {
    domainName: string
};

export interface Route53ZoneID {
    route53ZoneID: string,
};

export interface SiteBucket {
    siteBucket: s3.Bucket
};

export interface MotdUpdateErrorsNotifyEmails {
    errorsNotifyEmails: string[]
}