import task = require('azure-pipelines-task-lib/task');
import { injectable } from "inversify";
import { TerraformProviderType } from "./Provider/TerraformProviderType"

/**
 * Strong-type accessor for Task configuration
 */
@injectable()
export class TaskOptions {

    readonly provider : string | undefined;
    readonly command : string | undefined;
    readonly providerAzureConnectedServiceName : string | undefined;
    readonly initialize : boolean | undefined;

    readonly backend : string | undefined;

    readonly backendAzureUseProviderConnectedServiceForBackend : boolean | undefined;
    readonly backendAzureConnectedServiceName : string | undefined;
    readonly backendAzureStorageAccountName : string | undefined;
    readonly backendAzureProviderStorageAccountName : string | undefined;
    readonly backendAzureContainerName : string | undefined;
    readonly backendAzureStateFileKey : string | undefined;

    readonly scriptLocation : string | undefined;
    readonly scriptPath : string | undefined;
    readonly cwd : string | undefined;
    readonly script : string | undefined;
    
    readonly tempDir : string | undefined;
    readonly terraformProviderType : TerraformProviderType;

    constructor() {
        this.provider = task.getInput("provider", true);
        this.command = task.getInput("command", true);

        this.providerAzureConnectedServiceName = task.getInput("providerAzureConnectedServiceName")
        this.initialize = task.getInput("initialize") === "true";

        this.backend = task.getInput("backend");

        // Azure Backend
        this.backendAzureUseProviderConnectedServiceForBackend = task.getInput("backendAzureUseProviderConnectedServiceForBackend") === "true";
        this.backendAzureConnectedServiceName = task.getInput("backendAzureConnectedServiceName")
        this.backendAzureStorageAccountName = task.getInput("backendAzureStorageAccountName")
        this.backendAzureProviderStorageAccountName = task.getInput("backendAzureProviderStorageAccountName")
        this.backendAzureContainerName = task.getInput("backendAzureContainerName")
        this.backendAzureStateFileKey = task.getInput("backendAzureStateFileKey")

        // CLI Task
        this.scriptLocation = task.getInput("scriptLocation")
        this.scriptPath = task.getInput("scriptPath")
        this.cwd = task.getInput("cwd")
        this.script = task.getInput("script")
      
        
        this.tempDir = task.getVariable("Agent.TempDirectory");

        switch (task.getInput("providerType")) {
            case "Azure":
                this.terraformProviderType = TerraformProviderType.Azure;
                break;
            case "AWS":
                this.terraformProviderType = TerraformProviderType.Aws;
                break;
            case "GCP":
                this.terraformProviderType = TerraformProviderType.Gcp;
                break;
            case "Remote":
                this.terraformProviderType = TerraformProviderType.Remote;
                break;
            default:
                this.terraformProviderType = TerraformProviderType.Unknown;
        }
    }
}