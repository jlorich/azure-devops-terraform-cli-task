# A Terraform CLI Extension for Azure DevOps

This repository contains the source for an Azure DevOps extension that provides easy access to the Terraform CLI when talking to Azure.

This Task will provide an authenticated (and optionally intialized) context to run Terraform scripts in, and is specifically designed for easy use with YAML templates.

## Goals

The goals of this project is to make using Terraform within Azure DevOps just as easy as it is locally, mainly by abstracting the concerns of managing Service Principals and Storage access keys.

## Usage

Once the task has been installed from [the marketplace](https://marketplace.visualstudio.com/items?itemName=jlorich.TerraformCli) you can use it in any Azure Pipelines build or release job.

You can invoke the task using the following syntax:

```
- task: terraformcli@0
    inputs:
    targetAzureSubscription: MTC Denver Sandbox
    targetStorageAccountName: mtcdenterraformsandbox
    backendStateFileKey: 'terraform-labs.terraform.tfstate'
    workingDirectory: $(System.DefaultWorkingDirectory)/aks_advnet_rbac/
    script: |
        terraform plan \
        -input=false \
        -out=plan.tfplan
        
        # Apply the terraform plan
        terraform apply plan.tfplan
```

## Options

There are a number of options available for this task:

- __targetAzureSubscription:__ `[ServiceConnection]` An Azure DevOps Service Connection where Terraform will deploy resources.
- __scriptLocation:__ `[String]`  Where should the terraform commands be found.  Options: "Inline script", "Script Path". Defaults to "Inline Script"
- __scriptPath:__ `[FilePath]`  The path to the bash/powershell script to run.  This is only required when `scriptLocation` is set to "Script Path"
- __script:__ `[String]`  The Terraform script run.  This is only required when `scriptLocation` is not set or set to "Inline Script"
- __workingDirectory:__ `[String]`  What working directory should the script be executed in.  Defaults to the project root.
- __initialize:__ `[Boolean]`  Should `terraform init` automatically be run.  If this is specificed a storage account name needs to be provided.
- __useTargetSubscriptionForBackend:__ `[Boolean]` Should `targetAzureSubscription` also be used to access the Terraform backend. Defaults to True.
- __targetStorageAccountName:__ `[String]` If `useTargetSubscriptionForBackend` and `initialize` are true, this must be specified with the name of the storage account to use to store the Terraform backend state files.
- __backendConnectedServiceName:__ `[ServiceConnection]` If `useTargetSubscriptionForBackend` is false, this must be specific to provide access to the apporpriate subscription for the Terraform backend.
- __backendStorageAccountName:__ `[String]` If `useTargetSubscriptionForBackend` is false, this must contain the name for the storage account to keep the backend Terraform state files in.
- __backendContainerName:__ `[String]` The name of the storage container to use.  Defaults to tfstate
- __backendStateFileKey:__ `[String]` The name of the state file.  Defaults to terraform.tfstate

## Examples

A basic Azure Devops Pipeline deploying Terraform:

```
# azure-pipelines..yml

jobs:
- job: Deploy
displayName: Deploy
pool:
    vmImage: $(vmImageName)
steps:
- checkout: self
- task: terraformcli@0
    inputs:
    targetAzureSubscription: $(serviceConnectionName)
    targetStorageAccountName: mtcdenterraformsandbox
    backendStateFileKey: 'terraform-labs.terraform.tfstate'
    workingDirectory: $(System.DefaultWorkingDirectory)/aks_advnet_rbac/
    script: |
        # Output all commands run and fail if any fail
        set -e -x

        # Generate a terraform plan file
        terraform plan \
        -input=false \
        -var="ARM_CLIENT_ID=${ARM_CLIENT_ID}" \
        -var="ARM_CLIENT_SECRET=${ARM_CLIENT_SECRET}" \
        -out=plan.tfplan
        
        # Apply the terraform plan
        terraform apply plan.tfplan

``` 
