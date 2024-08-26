# My Website with cdk

Since 21/07/2024 karlcch.com is moving back to ltek.me

## Deploying

1. update bin/config.ts

   1. change your domain name and project name

   2. change the project name
   
2. `cdk synth`

### importing resource

For me I already have a hosted zone in Route53, to minimase downtime, import instead of recreate.

```sh
cdk synth
cdk import -f ltekme-SiteDomain-Route53-Stack
```

importing existing hosted zone will not effect any record set in the hosted zone. CloudFormation only look for the zone existance.

### Deploy One By One

Resource need to be deployed one by one. Not like

```sh
## import 
cdk import ltekme-SiteDomain-Route53-Stack

## deploy
cdk deploy ltekme-SiteDomain-ACM-Stack
cdk deploy ltekme-SiteContentStack
cdk deploy ltekme-SiteDistributionStack
```

This broke my hosted zone stack when I did this. for some reasona cdk decided that the certificate should be apart of the hosted zone stack.

To be safe, do this

```sh
cdk import ltekme-SiteDomain-Route53-Stack
cdk deploy ltekme-SiteDomain-Route53-Stack ltekme-SiteDomain-ACM-Stack
cdk deploy --all
```