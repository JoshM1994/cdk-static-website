const { exec: execCb } = require('child_process');
const { promisify } = require('util');
const exec = promisify(execCb)

const { CdkStaticWebsiteStack: { S3BucketName: s3SiteBucket, CfDistId: cfDistributionId } } = require('../../infrastructure/cdk-outputs.json');

const run = async () => {
    const response = await exec(`aws s3 sync build/ ${s3SiteBucket}`)
    console.debug(response);
    console.info(`To see changes immediately, run a cache invalidation on the Cloudfront Distribution:`)
    console.info(`aws cloudfront create-invalidation --distribution-id="${cfDistributionId}" --paths /`)
}
run();