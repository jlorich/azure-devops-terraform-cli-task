import os = require("os");
import task = require('azure-pipelines-task-lib/task');
import fs = require("fs");
import { injectable } from "inversify";
import { ToolRunner, IExecOptions, IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { TaskOptions } from "./TaskOptions";
import { TerraformProvider } from "./Provider/TerraformProvider";
import { AzureProvider } from "./Provider/Azure/AzureProvider";
import { TerraformProviderType } from "./Provider/TerraformProviderType";
import path = require("path");

@injectable()
export class TerraformCommandRunner {
    private readonly terraform : ToolRunner;

    public constructor(
        private provider : AzureProvider,
        private options: TaskOptions
        
    ) {
        this.terraform = this.createTerraformToolRunner();
    }

    /**
     * Initializes Terraform with the configuration specified from the provider
     */
    public async init() {
        let backendConfigOptions = await this.provider.getBackendConfigOptions();
        let args = new Array<string>();

        // Set the backend configuration values
        //
        // Values are not quoted intentionally - the way node spawns processes it will 
        // see quotes as part of the values
        for (let key in backendConfigOptions) {
            let value = backendConfigOptions[key];
            args.push(`-backend-config=${key}=${value}`);
        }

        await this.exec("init", args);
    }

    /**
     * Authenticates Terraform in the Process environment so future tasks can call
     * Terraform
     */
    public async authenticate() {
        this.provider.authenticate(true);
    }

   /**
     * Executes a script within an authenticated Terraform environment
     * @param script The location of the script to run
     */
    public async exec(cmd: string, args: Array<string>) {
        console.log("Executing terraform command");

        if (!this.options.command) {
            throw new Error("No command specified");
        }

        let authenticationEnv : { [key: string]: string; } = {};

        // Authenticate if not init or validate
        if (["init", "validate"].indexOf(this.options.command) >=0){
           authenticationEnv = await this.provider.authenticate();
        }

        let command = this.terraform
            .arg(cmd)
            .arg("-input=false");

        for (let arg of args) {
            command.arg(arg);
        }

        let result = await command.exec({
            cwd: path.join(process.cwd(), this.options.cwd || ""),
            env: {
                ...process.env,
                ...authenticationEnv
            },
            windowsVerbatimArguments: true
        } as unknown as IExecOptions);

        if (result > 0) {
            throw new Error("Terraform initalize failed");
        }
    }

    /**
     * Creates an Azure Pipelines ToolRunner for Terraform
     */
    private createTerraformToolRunner() : ToolRunner {
        let terraformPath = task.which("terraform", true);
        let terraform: ToolRunner = task.tool(terraformPath);

        return terraform;
    }

    /**
     * Creates an Azure Pipelines ToolRunner for Bash or CMD
     */
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
