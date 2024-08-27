import * as cdk from 'aws-cdk-lib';

export class SubProject {

    projectName: string;
    parentProjectName: string;
    app: cdk.App;
    stackPrefix: string;

    constructor(app: cdk.App, parentProjectName: string, projectName: string) {
        this.app = app;
        this.parentProjectName = parentProjectName;
        this.projectName = projectName;
        this.stackPrefix = parentProjectName + "-" + projectName
    }

}


export interface SubProjectStack {
    parentProjectName: string,
    projectName: string
}

export class SubProjectStack extends cdk.Stack {
    constructor(subProject: SubProject, id: string, props: cdk.StackProps) {
        super(subProject.app, id, props);

        cdk.Tags.of(this).add('Sub-Project', 'true');
        cdk.Tags.of(this).add('Parent-Project', subProject.parentProjectName);
        cdk.Tags.of(this).add('Project', subProject.projectName);

    }
}