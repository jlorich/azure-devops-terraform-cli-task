import "reflect-metadata";
import { Container, injectable, interfaces, inject } from "inversify";

import { Terraform } from "./Terraform";
import { TaskAuthentication } from './TaskAuthentication';
import { TaskOptions } from './TaskOptions';
import { TerraformCliTask } from './TerraformCliTask';
import { TerraformAuthentication } from './TerraformAuthentication';
import task = require('azure-pipelines-task-lib/task');
import { TaskResult } from "azure-pipelines-task-lib/task";


let container = new Container();

container.bind<TerraformCliTask>(TerraformCliTask).toSelf();
container.bind<TaskOptions>(TaskOptions).toSelf();
container.bind<TaskAuthentication>(TaskAuthentication).toSelf();
container.bind<TerraformAuthentication>(TerraformAuthentication).toSelf();
container.bind<Terraform>(Terraform).toSelf();

var cli = container.resolve(TerraformCliTask);

cli.run().then(function() 
{
    task.setResult(TaskResult.Succeeded, "Terraform successfully ran");
}, function() {
    task.setResult(TaskResult.Failed, "Terraform failed to run");
});
