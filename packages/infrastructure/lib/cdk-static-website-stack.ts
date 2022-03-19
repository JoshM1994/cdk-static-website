/* eslint-disable no-new */
/* eslint-disable import/prefer-default-export */
import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { BucketEncryption, BucketAccessControl, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
  ViewerCertificate,
  ViewerProtocolPolicy,
  HttpVersion,
  PriceClass,
  OriginAccessIdentity,
} from 'aws-cdk-lib/aws-cloudfront';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

const DOMAIN_NAME = 'YOURDOMAIN.com';
const WWW_DOMAIN_NAME = `www.${DOMAIN_NAME}`;

export class CdkStaticWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // No website related settings
      accessControl: BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const accessIdentity = new OriginAccessIdentity(this, 'CloudfrontAccess');
    const cloudfrontUserAccessPolicy = new PolicyStatement();
    cloudfrontUserAccessPolicy.addActions('s3:GetObject');
    cloudfrontUserAccessPolicy.addPrincipals(accessIdentity.grantPrincipal);
    cloudfrontUserAccessPolicy.addResources(siteBucket.arnForObjects('*'));
    siteBucket.addToResourcePolicy(cloudfrontUserAccessPolicy);

    // This step will block deployment until you add the relevant CNAME records through your domain registrar
    // Make sure you visit https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates
    // to check the CNAME records that need to be added
    // Idea for extension: build a Lambda custom resource that makes an API call to your domain registrar
    // to add the relevant CNAME records
    // (Obviously if you're using Route53, you can bypass this step):
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#domain-names-and-certificates
    const cert = new acm.Certificate(this, 'WebCert', {
      domainName: WWW_DOMAIN_NAME,
      subjectAlternativeNames: [DOMAIN_NAME],
      validation: CertificateValidation.fromDns(),
    });

    const ROOT_INDEX_FILE = 'index.html';
    const cfDist = new cloudfront.CloudFrontWebDistribution(this, 'CfDistribution', {
      comment: 'CDK Cloudfront Secure S3',
      viewerCertificate: ViewerCertificate.fromAcmCertificate(cert, {
        aliases: [DOMAIN_NAME, WWW_DOMAIN_NAME],
      }),
      defaultRootObject: ROOT_INDEX_FILE,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      httpVersion: HttpVersion.HTTP2,
      priceClass: PriceClass.PRICE_CLASS_100, // the cheapest
      originConfigs: [
        {
          s3OriginSource: {
            originAccessIdentity: accessIdentity,
            s3BucketSource: siteBucket,
            originPath: '/production',
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      // Allows React to handle all errors internally
      errorConfigurations: [
        {
          errorCachingMinTtl: 300, // in seconds
          errorCode: 403,
          responseCode: 200,
          responsePagePath: `/${ROOT_INDEX_FILE}`,
        },
        {
          errorCachingMinTtl: 300, // in seconds
          errorCode: 404,
          responseCode: 200,
          responsePagePath: `/${ROOT_INDEX_FILE}`,
        },
      ],
    });

    // You will need output to create a www CNAME record to
    new CfnOutput(this, 'CfDomainName', { value: cfDist.distributionDomainName });
  }
}
