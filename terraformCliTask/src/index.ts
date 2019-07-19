import "reflect-metadata";
import { Container, injectable, interfaces, inject } from "inversify";

import { Terraform } from "./Terraform";
import { TaskAuthentication } from './TaskAuthentication';
import { TaskOptions } from './TaskOptions';
import { TerraformCliTask } from './TerraformCliTask';
import { TerraformAuthentication } from './TerraformAuthentication';

let container = new Container();

container.bind<TerraformCliTask>(TerraformCliTask).toSelf();
container.bind<TaskOptions>(TaskOptions).toSelf();
container.bind<TaskAuthentication>(TaskAuthentication).toSelf();
container.bind<TerraformAuthentication>(TerraformAuthentication).toSelf();
container.bind<Terraform>(Terraform).toSelf();

var task = container.resolve(TerraformCliTask);
task.run();