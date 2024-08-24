import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export class SiteContentStack extends cdk.Stack {

    _bucket: Bucket;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this._bucket = new Bucket(this, "ltekme-site", {
            versioned: true,
            removalPolicy: RemovalPolicy.DESTROY
        });

    }

    get bucket() {
        return this._bucket
    }
}