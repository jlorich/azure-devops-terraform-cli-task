import os = require("os");
import task = require('azure-pipelines-task-lib/task');
import fs = require("fs");

import { Container, injectable, inject } from "inversify";
import { ToolRunner, IExecOptions, IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { TaskOptions } from "./TaskOptions";
import { TerraformAuthentication } from "./TerraformAuthentication";
import { AzureStorageService } from "./AzureStorageService";
import { TaskAuthentication } from "./TaskAuthentication";

@injectable()
export class Terraform {
    private readonly terraform : ToolRunner;
    private readonly auth : TerraformAuthentication;

    constructor(
        private options: TaskOptions,
    ) {
        this.auth = new TerraformAuthentication(options.ConnectedServiceName);
        this.terraform = this.createTerraformToolRunner();
    }


    /**
     * Initializes Terraform
     */
    public async init() {
        console.log("Initializing Terraform...");

        let auth : TaskAuthentication;

        if (this.options.UseTargetSubscriptionForBackend) {
            auth = new TaskAuthentication(this.options.ConnectedServiceName);
        } else {
            auth = new TaskAuthentication(this.options.BackendConnectedServiceName);
        }

        let storage = new AzureStorageService(auth);
        let storageAccount = this.options.UseTargetSubscriptionForBackend ? this.options.TargetStorageAccountName : this.options.BackendStorageAccountName;

        // I'd much prefer to use a SAS here but generating SAS isn't supported via the JS SDK without using a key
        let storage_key = await storage.GetKey(
            storageAccount,
            this.options.BackendContainerName);

        let result = await this.terraform
            .arg("init")
            .arg("-input=false")
            .arg(`-backend-config=storage_account_name=${storageAccount}`)
            .arg(`-backend-config=container_name=${this.options.BackendContainerName}`)
            .arg(`-backend-config=key=${this.options.BackendStateFileKey}`)
            .arg(`-backend-config=access_key=${storage_key}`)
            .exec({
                cwd: this.options.Cwd,
                env: {
                    ...process.env,
                    ...this.auth.ToEnv()
                },
                windowsVerbatimArguments: true
        } as unknown as IExecOptions);

        if (result > 0) {
            throw new Error("Terraform initalize failed");
        }
    }

    /**
     * Executes a script within an authenticated Terraform environment
     * @param script The location of the script to run
     */
    public async exec(script: string) {
        console.log("Executing terraform script");

        let content = fs.readFileSync(script,'utf8');

        console.log(content);

        let tool = this.createCliToolRunner(script);

        let result = await tool.exec({
            cwd: this.options.Cwd,
            env: {
                ...process.env,
                ...this.auth.ToEnv()
            },
            windowsVerbatimArguments: true
        } as unknown as IExecOptions);

        if (result > 0) {
            throw new Error("Terraform initalize failed");
        }
    }

    private createTerraformToolRunner() : ToolRunner {
        let terraformPath = task.which("terraform", true);
        let terraform: ToolRunner = task.tool(terraformPath);
        
        terraform.on("stdout", (data: Buffer) => {
            console.log(data.toString());
        });

        terraform.on("stderr", (data: Buffer) => {
            console.log(data.toString());
        });

        return terraform;
    }

    private createCliToolRunner(scriptPath : string) : ToolRunner {
        var tool;

        if (os.type() != "Windows_NT") {
            tool = task.tool(task.which("bash", true));
            tool.arg(scriptPath);
        } else {
            tool = task.tool(task.which(scriptPath, true));
        }

        return tool;
    }
}
