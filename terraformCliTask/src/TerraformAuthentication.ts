import { injectable } from "inversify";
import task = require('azure-pipelines-task-lib/task');
import { TaskAuthentication } from "./TaskAuthentication";
import { TaskAuthenticationMethod } from "./TaskAuthenticationMethod";

@injectable()
export class TerraformAuthentication {
    private auth: TaskAuthentication;

    constructor(private connectedServiceName: string) {
        this.auth = new TaskAuthentication(connectedServiceName);
    }

    public ToEnv(): { [key: string]: string; } {
        let env;
                
        switch (this.auth.taskAuthenticationMethod) {
            case TaskAuthenticationMethod.ServicePrincipalKey:
                env = this.GetServicePrincipalKeyEnv();
                break;
            case TaskAuthenticationMethod.ServicePrincipalCertificate:
                env = this.GetServicePrincipalCertificateEnv();
                break;
            case TaskAuthenticationMethod.ManagedIdentity:
                env = this.GetManagedIdentityEnv();
                break;
            default:
                env = {};
        }

        return {
            ARM_TENANT_ID: this.auth.armTenantId,
            ARM_SUBSCRIPTION_ID: this.auth.armSubscriptionId,
            ...env
        };
    }

    private GetServicePrincipalKeyEnv(): { [key: string]: string; } {
        return {
            ARM_CLIENT_ID: this.auth.armClientId,
            ARM_CLIENT_SECRET: this.auth.armClientSecret,
        };
    }

    private GetServicePrincipalCertificateEnv(): { [key: string]: string; } {
        return {
            ARM_CLIENT_ID: this.auth.armClientId,
            ARM_CLIENT_SECRET: this.auth.armClientSecret,
        };
    }

    private GetManagedIdentityEnv(): { [key: string]: string; } {
        return {
            ARM_USE_MSI: "true",
        };
    }

}