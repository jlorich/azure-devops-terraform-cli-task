import "reflect-metadata";
import { Container, injectable, interfaces, inject } from "inversify";
import { TaskResult } from "azure-pipelines-task-lib/task";
import task = require('azure-pipelines-task-lib/task');

import { TerraformCliTask } from './TerraformCliTask';
import { TerraformCommandRunner } from "./TerraformCommandRunner";
import { TaskOptions } from './TaskOptions';

import { AzureProvider } from './Provider/Azure/AzureProvider'


let container = new Container();

container.bind<TerraformCliTask>(TerraformCliTask).toSelf();
container.bind<TaskOptions>(TaskOptions).toSelf();
container.bind<TerraformCommandRunner>(TerraformCommandRunner).toSelf();

container.bind<AzureProvider>(AzureProvider).toSelf();

var cli = container.resolve(TerraformCliTask);
var options = container.resolve(TaskOptions);



cli.run().then(function() 
{
    task.setResult(TaskResult.Succeeded, "Terraform successfully ran");
}, function() {
    task.setResult(TaskResult.Failed, "Terraform failed to run");
});
