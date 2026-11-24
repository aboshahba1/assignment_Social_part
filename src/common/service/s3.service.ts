
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

import {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} from "../../config/config.service.js";

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createPreSignedUrl({
    path,
    ContentType,
    fileName,
    expiresIn = 60,
  }: {
    path: string;
    ContentType: string;
    fileName: string;
    expiresIn?: number;
  }) {
    const Key = `social_media_app/${path}/${randomUUID()}__${fileName}`;

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ContentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, Key };
  }

  async getPreSignedUrl({
    Key,
    expiresIn = 60,
    download,
  }: {
    Key: string;
    expiresIn?: number;
    download?: string;
  }) {
    const command = new GetObjectCommand({
      Key,
      Bucket: AWS_BUCKET_NAME,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${Key.split("/").pop()}"`
          : undefined,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Key,
      Bucket: AWS_BUCKET_NAME,
    });

    return await this.client.send(command);
  }
}
