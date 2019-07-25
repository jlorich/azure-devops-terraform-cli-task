import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { injectable } from "inversify";
import { TaskAuthentication } from "./TaskAuthentication";
import { TaskAuthenticationMethod } from "./TaskAuthenticationMethod";
import { AzureTokenCredentialsOptions } from "@azure/ms-rest-nodeauth";
import { StorageManagementClient } from "@azure/arm-storage";
import { ServiceClientCredentials } from "@azure/ms-rest-js";
/**
 * Strong-type accessor for Task configuration
 */
@injectable()
export class AzureStorageService {
    private readonly StorageUrl = "https://management.azure.com/"

    constructor(private auth: TaskAuthentication) {

    }

    public async GetKey(storageAccountName: string, containerName: string) : Promise<string> {
        var creds = await this.Login();
        var client = new StorageManagementClient(creds, this.auth.armSubscriptionId);
        var storageAccounts = await client.storageAccounts.list();

        var account = storageAccounts.find(item => item.name == storageAccountName);

        if (account == null) {
            throw new Error("Storage account not found");
        }

        var id = account.id || "";
        var regex = new RegExp("resourceGroups\/([a-zA-Z0-9_-]+)\/");
        var res = regex.exec(id) || [];
        var resourceGroupName = res[1];
        
        var keysResult = await client.storageAccounts.listKeys(resourceGroupName, storageAccountName);
        
        if (
            keysResult == null ||
            keysResult.keys == null ||
            keysResult.keys.length == 0 ||
            keysResult.keys[0].value == null
        ) {
            throw new Error("Could not get storage account keys");
        }

        return keysResult.keys[0].value;
    }

    private async Login() : Promise<ServiceClientCredentials> {
        switch(this.auth.taskAuthenticationMethod) {
            case TaskAuthenticationMethod.ManagedIdentity:
                return this.LoginWithManagedIdentity();
            case TaskAuthenticationMethod.ServicePrincipalKey:
                return this.LoginWithServicePrincipalKey();
            case TaskAuthenticationMethod.ServicePrincipalCertificate:
                return this.LoginWithServicePrincipalCertificate();
        }

        throw new Error("No valid authentication method specified");

    }

    private async LoginWithManagedIdentity() : Promise<ServiceClientCredentials> {
        var creds = await msRestNodeAuth.loginWithVmMSI({
            "resource": this.StorageUrl
        });

        return creds;
    }

    private async LoginWithServicePrincipalKey() : Promise<ServiceClientCredentials> {
        return msRestNodeAuth.loginWithServicePrincipalSecretWithAuthResponse(
            this.auth.armClientId,
            this.auth.armClientSecret,
            this.auth.armTenantId,
            {
                "tokenAudience": this.StorageUrl
            } as AzureTokenCredentialsOptions
        ).then((authres) => {
            return authres.credentials;
        });
    }

    private async LoginWithServicePrincipalCertificate() : Promise<ServiceClientCredentials> {
        var creds = await msRestNodeAuth.loginWithServicePrincipalCertificate(
            this.auth.armClientId,
            this.auth.armClientCertificatePath,
            this.StorageUrl
        );

       return creds;
    }
}
