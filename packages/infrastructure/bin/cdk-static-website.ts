#!/usr/bin/env node
/* eslint-disable no-new */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStaticWebsiteStack } from '../lib/cdk-static-website-stack';

const app = new cdk.App();
new CdkStaticWebsiteStack(app, 'CdkStaticWebsiteStack', {
  // us-east-1 is hard-coded as that is where the certificate must live
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
