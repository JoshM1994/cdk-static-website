# CDK Static Website

This is a template to build and deploy a static website hosted on S3 and served over HTTPS via CloudFront.

The resources created include:

- ACM certificate for serving a HTTPS website
- Private S3 bucket to host the website files
- CloudFront distribution acting as a CDN _and_ a method for serving the private S3 bucket exclusively through the distribution 
(not directly accessible via S3) using an [origin access identity](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- A template React website with deploy script

## Prerequisites

You will need

- A registered domain name (e.g. through Namecheap or GoDaddy)
- An AWS account
- Node 14 or above

## Getting Started

- Deploy the infrastructure:
    1. `cd packages/infrastructure`
    2. `export DOMAIN_NAME=yoursite.com`
    3. `npm install`
    4. `cdk deploy --outputs-file ./cdk-outputs.json` (note the outputs file - it will be required to deploy the static website files)
- Set-up the relevant CNAMEs for ACM - the infrastructure deployment will not complete until the ACM validation is complete. (The CNAMEs that need to be created will be visible through the [AWS console](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates))
- Once the deployment is complete, add the final `www` CNAME that points to the Cloudfront Distribution URL.
- Make relevant changes to the website content
  - If using React, the deploy script is already set-up
  - If not, remove the relevant react files and update `packages/site/scripts/deploy.js` to point to the relevant directory
- Deploy the site (from the `packages/site` directory) with `node scripts/deploy.js`
  - Optionally run the printed command to clear the Cloudfront cache to see your updated changes
