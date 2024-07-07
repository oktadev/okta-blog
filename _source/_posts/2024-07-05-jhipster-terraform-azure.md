---
layout: blog_post
title: "Deploy Secure Spring Boot Microservices on Azure AKS Using Terraform and Kubernetes"
author: jimena-garbarino
by: contractor
communities: [devops,security,java]
description: "Deploy a cloud-native Java Spring Boot microservice stack secured with Auth0 on Azure AKS using Terraform and Kubernetes."
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---

- introduction


> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 21](https://jdk.java.net/java-se-ri/21)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)
> - [Docker 24.0.7](https://docs.docker.com/desktop/)
> - [OpenFGA Server 1.5.1](https://hub.docker.com/r/openfga/openfga)
> - [FGA CLI v0.2.7](https://openfga.dev/docs/getting-started/cli)

{% include toc.md %}


## Build a microservices architecture with JHipster

Start by creating a Java microservices architecture using [JHipster](https://www.jhipster.tech/), Spring Boot, and Consul. JHipster is an excellent tool for generating a microservice stack with Spring Boot, Angular/React/Vue.js, and other modern frameworks. If you prefer using the same application as in this demo, then you can either scaffold it using JHipster JDL or clone the sample repository from GitHub. Here is how you can scaffold your microservice stack using JHipster:

### Option 1: Generate the architecture with JHipster Domain Language (JDL)

```shell
mkdir jhipster-microservice-stack
cd jhipster-microservice-stack
# download the JDL file.
jhipster download https://raw.githubusercontent.com/indiepopart/jhipster-terraform-azure/main/apps.jdl
# Update the `dockerRepositoryName` property to use your Docker Repository URI/Name.
# scaffold the apps.
jhipster jdl apps.jdl
```
### Option 2: Clone the sample repository

```shell
git clone https://github.com/indiepopart/jhipster-terraform-azure
```

## Create an AKS cluster using Terraform
- Architecture diagram
- Notes on firewall and gateway

```shell
mkdir terraform
cd terraform
mkdir modules
touch main.tf
touch outputs.tf
touch variables.tf
touch providers.tf
```

Edit the file `providers.tf` and add the following content:

```hcl
# terraform/providers.tf
terraform {
  required_version = ">=1.8"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.107"
    }
    random = {
      source  = "hashicorp/random"
      version = "~>3.0"
    }
    azapi = {
      source  = "azure/azapi"
      version = "~>1.5"
    }

  }
}

provider "azurerm" {
  features {}
}
```

### Configure a Hub Network and Azure Firewall

Create a module for the hub network configuration:

```shell
cd modules
mkdir hub_network
cd hub_network
touch main.tf
touch outputs.tf
touch variables.tf
```

Edit `main.tf` and add the following content:

```hcl
# terraform/modules/hub_network/main.tf

locals {
  pip_name   = "pip-fw-${var.resource_group_location}-default"
  hub_fw_name   = "fw-${var.resource_group_location}-hub"
  hub_vnet_name = "vnet-${var.resource_group_location}-hub"
  hub_rg_name   = "rg-hubs-${var.resource_group_location}"
}

resource "azurerm_resource_group" "rg_hub_networks" {
  name = local.hub_rg_name
  location = var.resource_group_location

  tags = {
    displayName = "Resource Group for Hub networks"
  }
}

resource "azurerm_virtual_network" "hub_vnet" {
  name                = local.hub_vnet_name
  location            = azurerm_resource_group.rg_hub_networks.location
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  address_space       = [var.hub_vnet_address_space]
}


resource "azurerm_subnet" "azure_firewall_subnet" {
  name                 = "AzureFirewallSubnet"
  resource_group_name  = azurerm_resource_group.rg_hub_networks.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes       = [var.azure_firewall_address_space]
  service_endpoints    = ["Microsoft.KeyVault"]
}

resource "azurerm_subnet" "gateway_subnet" {
  name                 = "GatewaySubnet"
  resource_group_name  = azurerm_resource_group.rg_hub_networks.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes       = [var.on_prem_gateway_addess_space]
  service_endpoints    = ["Microsoft.KeyVault"]
}

resource "azurerm_subnet" "bastion_subnet" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.rg_hub_networks.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes       = [var.bastion_address_space]
  service_endpoints    = ["Microsoft.KeyVault"]
}

resource "azurerm_public_ip" "hub_pip" {
  name                = local.pip_name
  location            = azurerm_resource_group.rg_hub_networks.location
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones              = ["1", "2", "3"]
  idle_timeout_in_minutes = 4
  ip_version = "IPv4"

}

resource "azurerm_firewall" "azure_firewall" {
  name                = local.hub_fw_name
  location            = azurerm_resource_group.rg_hub_networks.location
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Standard"
  zones               = ["1", "2", "3"]
  threat_intel_mode   = "Alert"
  dns_proxy_enabled    = true

  ip_configuration {
    name                 = local.pip_name
    subnet_id            = azurerm_subnet.azure_firewall_subnet.id
    public_ip_address_id = azurerm_public_ip.hub_pip.id
  }
}

resource "azurerm_ip_group" "aks_ip_group" {
  name                = "aks_ip_group"
  location            = azurerm_resource_group.rg_hub_networks.location
  resource_group_name = azurerm_resource_group.rg_hub_networks.name

  cidrs = [var.cluster_nodes_address_space]

}

resource "azurerm_firewall_network_rule_collection" "org_wide_allow" {
  name                = "org-wide-allowed"
  azure_firewall_name = azurerm_firewall.azure_firewall.name
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  priority            = 100
  action              = "Allow"

  rule {
    name = "dns"

    source_addresses = [
      "*",
    ]

    protocols = [
      "UDP",
    ]

    destination_ports = [
      "53",
    ]

    destination_addresses = [
      "*",
    ]

  }

  rule {
    name = "ntp"
    description = "Network Time Protocol (NTP) time synchronization"

    source_addresses = [
      "*",
    ]

    protocols = [
      "UDP",
    ]

    destination_ports = [
      "123",
    ]

    destination_addresses = [
      "*",
    ]
  }

}


resource "azurerm_firewall_network_rule_collection" "aks_global_allow" {
  name                = "aks-global-requirements"
  azure_firewall_name = azurerm_firewall.azure_firewall.name
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  priority            = 200
  action              = "Allow"

  rule {
    name = "tunnel-front-pod-tcp"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    protocols = [
      "TCP",
    ]

    destination_ports = [
      "22",
      "9000"
    ]

    destination_addresses = [
      "AzureCloud",
    ]

  }

  rule {
    name = "tunnel-front-pod-udp"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    protocols = [
      "UDP",
    ]

    destination_ports = [
      "1194",
      "123"
    ]

    destination_addresses = [
      "AzureCloud",
    ]

  }

  rule {
    name = "managed-k8s-api-tcp-443"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    protocols = [
      "TCP",
    ]

    destination_ports = [
      "443",
    ]

    destination_addresses = [
      "AzureCloud",
    ]

  }

  rule {
    name = "docker"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    protocols = [
      "TCP"
    ]

    destination_ports = [
       "443"
    ]

    destination_fqdns = [
      "docker.io",
      "registry-1.docker.io",
      "production.cloudflare.docker.com"
    ]
  }


}


resource "azurerm_firewall_application_rule_collection" "aks_global_allow" {
  name                = "aks-global-requirements"
  azure_firewall_name = azurerm_firewall.azure_firewall.name
  resource_group_name = azurerm_resource_group.rg_hub_networks.name
  priority            = 200
  action              = "Allow"

  rule {
    name = "nodes-to-api-server"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "*.hcp.eastus2.azmk8s.io",
      "*.tun.eastus2.azmk8s.io"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "microsoft-container-registry"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "*.cdn.mscr.io",
      "mcr.microsoft.com",
      "*.data.mcr.microsoft.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "management-plane"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "management.azure.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "aad-auth"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "login.microsoftonline.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "apt-get"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "packages.microsoft.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "cluster-binaries"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "acs-mirror.azureedge.net"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }
  rule {
    name = "ubuntu-security-patches"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "security.ubuntu.com",
      "azure.archive.ubuntu.com",
      "changelogs.ubuntu.com"
    ]

    protocol {
      port = "80"
      type = "Http"
    }
  }
  rule {
    name = "azure-monitor"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "dc.services.visualstudio.com",
      "*.ods.opinsights.azure.com",
      "*.oms.opinsights.azure.com",
      "*.microsoftonline.com",
      "*.monitoring.azure.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }

  rule {
    name = "azure-policy"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "gov-prod-policy-data.trafficmanager.net",
      "raw.githubusercontent.com",
      "dc.services.visualstudio.com",
      "data.policy.core.windows.net",
      "store.policy.core.windows.net"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }

  rule {
    name = "azure-kubernetes-service"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    fqdn_tags = [
      "AzureKubernetesService"
    ]

  }

  rule {
    name = "auth0"

    source_ip_groups = [
      azurerm_ip_group.aks_ip_group.id,
    ]

    target_fqdns = [
      "*.auth0.com"
    ]

    protocol {
      port = "443"
      type = "Https"
    }
  }

}

```

The configuration above will create a Hub Newtwork with a subnet for the Azure Firewall through which outbound traffic will be routed.

Edit `variables.tf` and add the following content:

```hcl
# terraform/modules/hub_network/variables.tf
variable "resource_group_location" {
  description = "The location of the resource group"
}

variable "on_prem_gateway_addess_space" {
  description = "A /27 under the VNet Address Space for our On-Prem Gateway"
  default     = "10.200.0.64/27"
}

variable "bastion_address_space" {
  description = "A /27 under the VNet Address Space for Azure Bastion"
  default     = "10.200.0.96/27"
}

variable "hub_vnet_address_space" {
  description = "The address space for the hub virtual network."
  default = "10.200.0.0/24"
}

variable "azure_firewall_address_space" {
  description = "The address space for the Azure Firewall subnet."
  default = "10.200.0.0/26"
}

variable "cluster_nodes_address_space" {
  description = "The address space for the cluster nodes."
}
```

Edit `outputs.tf` and add the following content:

```hcl
# terraform/modules/hub_network/outputs.tf
output "hub_vnet_id" {
  value = azurerm_virtual_network.hub_vnet.id
}

output "hub_vnet_name" {
  value = azurerm_virtual_network.hub_vnet.name
}

output "hub_fw_private_ip" {
  value = azurerm_firewall.azure_firewall.ip_configuration.0.private_ip_address
}

output "hub_rg_name" {
  value = azurerm_resource_group.rg_hub_networks.name
}

output "hub_pip" {
  value = azurerm_public_ip.hub_pip.ip_address
}

output "fw_net_rule_org_wide_id" {
  value = azurerm_firewall_network_rule_collection.org_wide_allow.id
}

output "fw_net_rule_aks_global_id" {
  value = azurerm_firewall_network_rule_collection.aks_global_allow.id
}

output "fw_app_rule_aks_global_id" {
  value = azurerm_firewall_application_rule_collection.aks_global_allow.id
}

output "azure_firewall_id" {
  value = azurerm_firewall.azure_firewall.id
}
```

### Configure a Spoke Network and Azure Application Gateway

Create a module for the spoke network configuration:

```shell
cd modules
mkdir spoke_network
cd spoke_network
touch main.tf
touch outputs.tf
touch variables.tf
```

Edit `main.tf` and add the following content:

```hcl
# terraform/modules/spoke_network/main.tf
locals {
  spoke_vnet_name = "vnet-${var.resource_group_location}-spoke"
  spoke_rg_name = "rg-spokes-${var.resource_group_location}"
  pip_name = "pip-${var.application_id}-00"
  backend_address_pool_name      = "app-gwateway-beap"
  frontend_port_name             = "app-gateway-feport"
  frontend_ip_configuration_name = "app-gateway-feip"
  http_setting_name              = "app-gateway-be-htst"
  listener_name                  = "app-gateway-httplstn"
  request_routing_rule_name      = "app-gateway-rqrt"
  redirect_configuration_name    = "app-gateway-rdrcfg"
  gateway_pip_name               = "app-gateway-pip"
}


resource "azurerm_resource_group" "rg_spoke_networks" {
  name = local.spoke_rg_name
  location = var.resource_group_location

  tags = {
    displayName = "Resource Group for Spoke networks"
  }
}

resource "azurerm_virtual_network" "spoke_vnet" {
  name                = local.spoke_vnet_name
  location            = azurerm_resource_group.rg_spoke_networks.location
  resource_group_name = azurerm_resource_group.rg_spoke_networks.name
  address_space       = [var.spoke_vnet_address_space]
}

resource "azurerm_subnet" "cluster_nodes_subnet" {
  name                 = "snet-clusternodes"
  resource_group_name  = azurerm_resource_group.rg_spoke_networks.name
  virtual_network_name = azurerm_virtual_network.spoke_vnet.name
  address_prefixes       = [var.cluster_nodes_address_space]
}

resource "azurerm_route_table" "spoke_route_table" {
  name                = "route-spoke-to-hub"
  location            = azurerm_resource_group.rg_spoke_networks.location
  resource_group_name = azurerm_resource_group.rg_spoke_networks.name

  route {
    name                = "r-nexthop-to-fw"
    address_prefix      = "0.0.0.0/0"
    next_hop_type       = "VirtualAppliance"
    next_hop_in_ip_address = var.hub_fw_private_ip
  }
  route {
    name                = "r-internet"
    address_prefix      = "${var.hub_fw_public_ip}/32"
    next_hop_type       = "Internet"
  }
}

resource "azurerm_subnet_route_table_association" "cluster_nodes_route_table" {
  subnet_id = azurerm_subnet.cluster_nodes_subnet.id
  route_table_id = azurerm_route_table.spoke_route_table.id
}

resource "azurerm_subnet" "ingress_services_subnet" {
  name                 = "snet-ingress-services"
  resource_group_name  = azurerm_resource_group.rg_spoke_networks.name
  virtual_network_name = azurerm_virtual_network.spoke_vnet.name
  address_prefixes       = [var.ingress_services_address_space]

}

resource "azurerm_subnet" "application_gateways_subnet" {
  name                 = "snet-application-gateways"
  resource_group_name  = azurerm_resource_group.rg_spoke_networks.name
  virtual_network_name = azurerm_virtual_network.spoke_vnet.name
  address_prefixes       = [var.application_gateways_address_space]

}

resource "azurerm_virtual_network_peering" "spoke_to_hub_peer" {
  name                      = "spoke-to-hub"
  resource_group_name       = azurerm_resource_group.rg_spoke_networks.name
  virtual_network_name      = azurerm_virtual_network.spoke_vnet.name
  remote_virtual_network_id = var.hub_vnet_id
  allow_virtual_network_access = true
  allow_forwarded_traffic = true
  allow_gateway_transit = false
  use_remote_gateways = false

  depends_on = [
    var.hub_vnet_id,
    azurerm_virtual_network.spoke_vnet
  ]
}

resource "azurerm_virtual_network_peering" "hub_to_spoke_peer" {
  name                      = "hub-to-spoke"
  resource_group_name       = var.hub_rg_name
  virtual_network_name      = var.hub_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.spoke_vnet.id
  allow_forwarded_traffic = false
  allow_virtual_network_access = true
  allow_gateway_transit = false
  use_remote_gateways = false

  depends_on = [
    var.hub_vnet_id,
    azurerm_virtual_network.spoke_vnet
  ]

}

resource "azurerm_private_dns_zone" "dns_zone_acr" {
  name                = "privatelink.azurecr.io"
  resource_group_name = azurerm_resource_group.rg_spoke_networks.name
}


resource "azurerm_private_dns_zone_virtual_network_link" "acr_network_link" {
  name                  = "dns-link-acr"
  resource_group_name   = azurerm_resource_group.rg_spoke_networks.name
  private_dns_zone_name = azurerm_private_dns_zone.dns_zone_acr.name
  virtual_network_id    = azurerm_virtual_network.spoke_vnet.id
}

resource "azurerm_public_ip" "spoke_pip" {
  name                = local.pip_name
  location            = azurerm_resource_group.rg_spoke_networks.location
  resource_group_name = azurerm_resource_group.rg_spoke_networks.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones              = ["1","2", "3"]
  idle_timeout_in_minutes = 4
  ip_version = "IPv4"
}


resource "azurerm_application_gateway" "gateway" {
  name                = "app-gateway"
  location            = azurerm_resource_group.rg_spoke_networks.location
  resource_group_name = azurerm_resource_group.rg_spoke_networks.name
  zones               = ["1", "2", "3"]

  sku {
    name     = "WAF_v2"
    tier     = "WAF_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "gateway-ip-configuration"
    subnet_id = azurerm_subnet.application_gateways_subnet.id
  }

  frontend_port {
    name = local.frontend_port_name
    port = 80
  }

  frontend_ip_configuration {
    name                 = local.frontend_ip_configuration_name
    public_ip_address_id = azurerm_public_ip.spoke_pip.id
  }

  waf_configuration {
    enabled = true
    firewall_mode = "Prevention"
    rule_set_type = "OWASP"
    rule_set_version = "3.0"
  }

  backend_address_pool {
    name = local.backend_address_pool_name
  }

  backend_http_settings {
    name                  = local.http_setting_name
    cookie_based_affinity = "Disabled"
    path                  = "/path1/"
    port                  = 80
    protocol              = "Http"
    pick_host_name_from_backend_address = true
    request_timeout       = 60
  }

  http_listener {
    name                           = local.listener_name
    frontend_ip_configuration_name = local.frontend_ip_configuration_name
    frontend_port_name             = local.frontend_port_name
    protocol                       = "Http"
    host_name                      = var.host_name
    #require_sni                    = true
  }

  request_routing_rule {
    name                       = local.request_routing_rule_name
    priority                   = 1
    rule_type                  = "Basic"
    http_listener_name         = local.listener_name
    backend_address_pool_name  = local.backend_address_pool_name
    backend_http_settings_name = local.http_setting_name
  }
}
```
The configuration above will create a Spoke Network, the network peerings hub-spoke and spoke-hub, and the Azure application gateway hosted in its own subnet.

Edit `outputs.tf` and add the following content:

```hcl
# terraform/modules/spoke_network/outputs.tf
```

Edit `variables.tf` and add the following content:

```hcl
# terraform/modules/spoke_network/variables.tf
```

### Configure an Azure Kubernetes Cluster

- ACR
- Cluster

Create a module for the Azure Container Registry (ACR) configuration:

```shell
cd modules
mkdir acr
cd acr
touch main.tf
touch outputs.tf
touch variables.tf
```

Create a module for the Azure Kubernetes Service (AKS) configuration:

```shell
cd modules
mkdir cluster
cd cluster
touch main.tf
touch outputs.tf
touch variables.tf
```


Edit `outputs.tf` and add the following content:

```hcl
# terraform/modules/spoke_network/outputs.tf
```

## Provision the cluster
- Create account

# Set up OIDC Authentication using Auth0

# Deploy the microservices stack

# Tear down the cluster with Terraform

# Learn more
