import * as cdk from 'aws-cdk-lib';

export interface SubProjectParam {
    parentProjectName: string,
    projectName: string
}
export class SubProject {

    projectName: string;
    parentProjectName: string;
    app: cdk.App;
    stackPrefix: string;

    constructor(app: cdk.App, param: SubProjectParam) {
        this.app = app;
        this.parentProjectName = param.parentProjectName;
        this.projectName = param.projectName;
        this.stackPrefix = param.parentProjectName + "-" + param.projectName
    }

}


export class SubProjectStack extends cdk.Stack {
    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject.app, id, props);

        cdk.Tags.of(this).add('Sub-Project', 'true');
        cdk.Tags.of(this).add('Parent-Project', subProject.parentProjectName);
        cdk.Tags.of(this).add('Project', subProject.projectName);

    }
}