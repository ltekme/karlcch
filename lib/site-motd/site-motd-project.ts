import * as cdk from 'aws-cdk-lib';
import { SubProject, SubProjectParam, SubProjectStack } from '..';
import { SiteMotdStack, SiteMotdStackParam } from './stacks/site-motd-stack';

interface MotdSubProjectParam extends SubProjectParam, SiteMotdStackParam { }

export class MotdSubProject extends SubProject {

    siteMotdStack: SubProjectStack;

    constructor(app: cdk.App, params: MotdSubProjectParam) {
        super(app, params);

        this.siteMotdStack = new SiteMotdStack(this, this.stackPrefix + "-Stack", {
            notifyErrorsEmails: params.notifyErrorsEmails,
            motdPageBucket: params.motdPageBucket,
        }, {
            stackName: this.stackPrefix + "-Stack",
            description: 'stack for site motd'
        });

    }

}