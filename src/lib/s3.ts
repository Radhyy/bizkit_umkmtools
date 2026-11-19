import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'id-jkt-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3-id-jkt-1.kilatstorage.id',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads a file buffer to KilatStorage S3 and returns the public accessible URL.
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  originalFilename: string,
  contentType: string,
  folder: string = 'logos'
): Promise<UploadResult> {
  const bucketName = process.env.S3_BUCKET_NAME || 'bizkit-tools';
  const endpoint = process.env.S3_ENDPOINT || 'https://s3-id-jkt-1.kilatstorage.id';

  // Sanitize extension
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
  const key = `${folder}/${Date.now()}-${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const url = `${cleanEndpoint}/${bucketName}/${key}`;

  return { url, key };
}

/**
 * Deletes an object from KilatStorage S3 by key or full URL.
 */
export async function deleteFromS3(keyOrUrl: string): Promise<void> {
  const bucketName = process.env.S3_BUCKET_NAME || 'bizkit-tools';
  let key = keyOrUrl;

  if (keyOrUrl.startsWith('http')) {
    const parts = keyOrUrl.split(`/${bucketName}/`);
    if (parts.length > 1) {
      key = parts[1];
    }
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export default s3Client;

