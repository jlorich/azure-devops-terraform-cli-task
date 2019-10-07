import { injectable } from "inversify";
import task = require('azure-pipelines-task-lib/task');
import { ARMConnectedServiceOptions } from "./ARMConnectedServiceOptions";
import { ARMAuthenticationMethod } from "./ARMAuthenticationMethod";
import { TerraformProvider } from "../TerraformProvider";
import { TaskOptions } from "../../TaskOptions";
import { AzureStorageService } from "./AzureStorageService"

/**
 * Terraform Azure Provider and Backend
 */
@injectable()
export class AzureProvider implements TerraformProvider {
    private armConnectedService: ARMConnectedServiceOptions;
    
    constructor(private options : TaskOptions) {
        this.armConnectedService = new ARMConnectedServiceOptions(this.options.ConnectedServiceName);
    }

    /**
     * Loads the ARM connected service information
     */
    public async configure(): Promise<void> {
        
    }

    /**
     * Builds an object containing all the apporpriate values needed to set as Environment Variables
     * for Terraform to be authenticated with the Azure Resource Manager connection provided
     */
    public async getEnv(): Promise<{ [key: string]: string; }> {
        let env : object;
                
        switch (this.armConnectedService.authenticationMethod) {
            case ARMAuthenticationMethod.ServicePrincipalKey:
                env = this.getServicePrincipalKeyEnv();
                break;
            case ARMAuthenticationMethod.ServicePrincipalCertificate:
                env = this.getServicePrincipalCertificateEnv();
                break;
            case ARMAuthenticationMethod.ManagedIdentity:
                env = this.getManagedIdentityEnv();
                break;
            default:
                env = {};
        }

        return {
            ARM_TENANT_ID: this.armConnectedService.tenantId,
            ARM_SUBSCRIPTION_ID: this.armConnectedService.subscriptionId,
            ...env
        };
    }

    /**
     * Builds an object containing all the apporpriate values needed to set as backend-config
     * for Terraform to be use an Azure Storage Account as the backend
     */
    public async getBackendConfig(): Promise<{ [key: string]: string; }> {
        let connectedService : ARMConnectedServiceOptions;

        if (this.options.UseTargetSubscriptionForBackend) {
            connectedService = this.armConnectedService;
        } else {
            connectedService = new ARMConnectedServiceOptions(this.options.BackendConnectedServiceName)
        }

        let storage = new AzureStorageService(connectedService);
        let storageAccount = this.options.UseTargetSubscriptionForBackend ? this.options.TargetStorageAccountName : this.options.BackendStorageAccountName;

        // I'd much prefer to use a SAS here but generating SAS isn't supported via the JS SDK without using a key
        let storage_key = await storage.getKey(
            storageAccount,
            this.options.BackendContainerName);

        return {
            storage_account_name: storageAccount,
            container_name: this.options.BackendContainerName,
            key: this.options.BackendStateFileKey,
            access_key: storage_key
        }
    }

    /**
     * Gets the appropraite ENV vars for Service Principal Key authentication
     */
    private getServicePrincipalKeyEnv(): { [key: string]: string; } {
        return {
            ARM_CLIENT_ID: this.armConnectedService.clientId,
            ARM_CLIENT_SECRET: this.armConnectedService.clientSecret,
        };
    }

    /**
     * Gets the appropraite ENV vars for Service Principal Cert authentication
     */
    private getServicePrincipalCertificateEnv(): { [key: string]: string; } {
        return {
            ARM_CLIENT_ID: this.armConnectedService.clientId,
            ARM_CLIENT_SECRET: this.armConnectedService.clientSecret,
        };
    }

    /**
     * Gets the appropraite ENV vars for Managed Identity authentication
     */
    private getManagedIdentityEnv(): { [key: string]: string; } {
        return {
            ARM_USE_MSI: "true",
        };
    }
}
