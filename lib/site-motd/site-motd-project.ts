import * as cdk from 'aws-cdk-lib';
import { SubProject, SubProjectParam, SubProjectStack } from '..';
import { SiteMotdStack } from './stacks/site-motd-stack';


interface MotdSubProjectParam extends SubProjectParam { }

export class MotdSubProject extends SubProject {

    siteMotdStack: SubProjectStack;

    constructor(app: cdk.App, params: MotdSubProjectParam) {
        super(app, params);

        this.siteMotdStack = new SiteMotdStack(this, this.stackPrefix + "-Stack", {
            stackName: this.stackPrefix + "-Stack",
            description: 'stack for site motd'
        });

    }

}