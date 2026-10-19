import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_STORAGE_DIR = isServerless
  ? path.join('/tmp', 'kartuli-deck-storage')
  : path.resolve(process.cwd(), '.data', 'storage');

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (
    config.STORAGE_DRIVER === 's3' &&
    config.S3_BUCKET &&
    config.S3_ACCESS_KEY_ID &&
    config.S3_SECRET_ACCESS_KEY
  ) {
    if (!s3Client) {
      s3Client = new S3Client({
        region: config.S3_REGION || 'us-east-1',
        endpoint: config.S3_ENDPOINT || undefined,
        credentials: {
          accessKeyId: config.S3_ACCESS_KEY_ID,
          secretAccessKey: config.S3_SECRET_ACCESS_KEY,
        },
        forcePathStyle: Boolean(config.S3_ENDPOINT),
      });
    }
    return s3Client;
  }
  return null;
}

export interface StoredAssetResult {
  url: string;
  storageKey: string;
  mimeType: string;
  driver: 's3' | 'local' | 'data-uri';
}

/**
 * Stores generated card illustrations in S3-compatible object storage when configured,
 * or in `.data/storage` (served at `/storage/...`) during local development.
 * Avoids storing raw binary blobs inside PostgreSQL columns.
 */
export async function storeCardIllustration(params: {
  base64Data?: string;
  svgString?: string;
  mimeType: string;
  cardId: string;
}): Promise<StoredAssetResult> {
  const ext =
    params.mimeType === 'image/svg+xml'
      ? 'svg'
      : params.mimeType === 'image/jpeg'
      ? 'jpg'
      : 'png';

  const filename = `cards/${params.cardId}-${uuidv4().slice(0, 8)}.${ext}`;
  const buffer = params.base64Data
    ? Buffer.from(params.base64Data, 'base64')
    : Buffer.from(params.svgString || '', 'utf-8');

  const s3 = getS3Client();
  if (s3 && config.S3_BUCKET) {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: params.mimeType,
      })
    );

    const publicBase =
      config.S3_PUBLIC_URL_BASE?.replace(/\/$/, '') ||
      `https://${config.S3_BUCKET}.s3.${config.S3_REGION}.amazonaws.com`;

    return {
      url: `${publicBase}/${filename}`,
      storageKey: filename,
      mimeType: params.mimeType,
      driver: 's3',
    };
  }

  // In serverless environments without S3 configured, return inline data URI so assets persist across stateless invocations
  if (isServerless) {
    const dataUri = params.base64Data
      ? `data:${params.mimeType};base64,${params.base64Data}`
      : `data:image/svg+xml;utf8,${encodeURIComponent(params.svgString || '')}`;
    return {
      url: dataUri,
      storageKey: filename,
      mimeType: params.mimeType,
      driver: 'data-uri',
    };
  }

  // If SVG data URI is passed directly for demo/fallback, keep or write to local storage
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(path.join(LOCAL_STORAGE_DIR, 'cards'), { recursive: true });
  } else if (!fs.existsSync(path.join(LOCAL_STORAGE_DIR, 'cards'))) {
    fs.mkdirSync(path.join(LOCAL_STORAGE_DIR, 'cards'), { recursive: true });
  }

  const fullLocalPath = path.join(LOCAL_STORAGE_DIR, filename);
  fs.writeFileSync(fullLocalPath, buffer);

  return {
    url: `/storage/${filename}`,
    storageKey: filename,
    mimeType: params.mimeType,
    driver: 'local',
  };
}

export function getLocalStorageDir(): string {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(path.join(LOCAL_STORAGE_DIR, 'cards'), { recursive: true });
  }
  return LOCAL_STORAGE_DIR;
}
