import os = require("os");
import task = require('azure-pipelines-task-lib/task');
import fs = require("fs");

import { Container, injectable, inject } from "inversify";
import { ToolRunner, IExecOptions, IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { TaskOptions } from "./TaskOptions";
import { TerraformProvider } from "./Provider/TerraformProvider";

@injectable()
export class Terraform {
    private readonly terraform : ToolRunner;

    constructor(
        private options: TaskOptions,
        private provider : TerraformProvider
    ) {
        this.terraform = this.createTerraformToolRunner();
    }

    /**
     * Initializes Terraform with the configuration specified from the provider
     */
    public async init() {
        let backendConfig = await this.provider.getBackendConfig();
        let args = new Array<string>();

        // Set the backend configuration values
        for (let key in backendConfig) {
            let value = backendConfig[key];
            args.push(`-backend-config="${key}=${value}"`);
        }

        await this.exec("init", args);
    }

    /**
     * Executes a script within an authenticated Terraform environment
     * @param script The location of the script to run
     */
    public async cli(script: string) {
        console.log("Executing terraform script");

        let content = fs.readFileSync(script,'utf8');

        console.log(content);

        let env = this.provider.getEnv();
        let tool = this.createCliToolRunner(script);

        let result = await tool.exec({
            cwd: this.options.Cwd,
            env: {
                ...process.env,
                ...env
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
    public async exec(cmd: string, args: Array<string>) {
        console.log("Executing terraform command");

        let env = this.provider.getEnv();

        let command = this.terraform
            .arg(cmd)
            .arg("-input=false");

        for (let arg in args) {
            command.arg(arg);
        }

        let result = await command.exec({
            cwd: this.options.Cwd,
            env: {
                ...process.env,
                ...env
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
        
        terraform.on("stdout", (data: Buffer) => {
            console.log(data.toString());
        });

        terraform.on("stderr", (data: Buffer) => {
            console.log(data.toString());
        });

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
