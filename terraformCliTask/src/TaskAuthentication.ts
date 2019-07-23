import { injectable } from "inversify";
import task = require('azure-pipelines-task-lib/task');
import fs = require("fs");
import path = require("path");
import { TaskAuthenticationMethod } from "./TaskAuthenticationMethod";

/**
 * Strong-type accessor for Task configuration
 */
@injectable()
export class TaskAuthentication {
    public armClientId: string = "";
    public armClientSecret: string = "";
    public armClientCertificatePath: string = "";
    public armTenantId: string = "";
    public armSubscriptionId: string = "";
    public taskAuthenticationMethod: TaskAuthenticationMethod = TaskAuthenticationMethod.Unknown;

    constructor(private connectedServiceName: string) {
        let authScheme = task.getEndpointAuthorizationScheme(connectedServiceName, true);

        this.LoadArmDetails();

        switch(authScheme.toLowerCase()) {
            case "serviceprincipal":
                this.LoadServicePrincipalDetails();
                break;
            case "managedserviceidentity":
                this.LoadManagedIdentityDetails();
                break;
        }
    }

    private LoadArmDetails() {
        this.armTenantId = task.getEndpointAuthorizationParameter(this.connectedServiceName, "tenantid", true);
        this.armSubscriptionId = task.getEndpointDataParameter(this.connectedServiceName, 'subscriptionid', true);
    }

    private LoadServicePrincipalDetails() {
        let authType = task.getEndpointAuthorizationParameter(this.connectedServiceName, 'authenticationType', true);
        this.armClientId = task.getEndpointAuthorizationParameter(this.connectedServiceName, "serviceprincipalid", false);

        switch(authType) {
            case "spnCertificate":
                    this.LoadServicePrincipalCertificateDetails();
                break;
            default:
                this.LoadServicePrincipalKeyDetails();
        }
    }

    private LoadServicePrincipalKeyDetails() {
        this.taskAuthenticationMethod = TaskAuthenticationMethod.ServicePrincipalKey;
        this.armClientSecret = task.getEndpointAuthorizationParameter(this.connectedServiceName, "serviceprincipalkey", false);
    }

    private LoadServicePrincipalCertificateDetails() {
        this.taskAuthenticationMethod = TaskAuthenticationMethod.ServicePrincipalCertificate;
        let certificateContent: string = task.getEndpointAuthorizationParameter(this.connectedServiceName, "servicePrincipalCertificate", false);
        let certificatePath = path.join(task.getVariable('Agent.TempDirectory') || task.getVariable('system.DefaultWorkingDirectory'), 'spnCert.pem');
        
        fs.writeFileSync(certificatePath, certificateContent);

        this.armClientCertificatePath = certificatePath;
    }

    private LoadManagedIdentityDetails() {
        this.taskAuthenticationMethod = TaskAuthenticationMethod.ManagedIdentity;
    }
}