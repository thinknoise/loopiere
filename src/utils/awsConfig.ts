// src/utils/awsConfig.ts
import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

export const REGION = "us-east-2";
export const BUCKET = "loopiere-recording";
export const IDENTITY_POOL_ID =
  "us-east-2:27944dd9-244f-44e0-9300-87d4baa87f2a";

export const s3 = new S3Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    clientConfig: { region: REGION },
  }),
});
