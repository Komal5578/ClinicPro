const path = require('path');
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = require('../config/env');

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const CERTIFICATE_BUCKET = process.env.SUPABASE_CERTIFICATE_BUCKET || 'doctor-certificates';
const SIGNATURE_BUCKET = process.env.SUPABASE_SIGNATURE_BUCKET || 'doctor-signatures';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for storage uploads');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const bucketCache = new Set();

const ensureBucket = async (bucketName) => {
  if (bucketCache.has(bucketName)) return;

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`Unable to list storage buckets: ${listError.message}`);
  }

  const exists = buckets.some((bucket) => bucket.name === bucketName);
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    if (createError) {
      throw new Error(`Unable to create bucket ${bucketName}: ${createError.message}`);
    }
  }

  bucketCache.add(bucketName);
};

const buildStoragePath = (prefix, file) => {
  const safeBase = path.basename(file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}/${Date.now()}-${safeBase}`;
};

const uploadBuffer = async ({ bucketName, prefix, file }) => {
  if (!file?.buffer) return null;

  await ensureBucket(bucketName);

  const storagePath = buildStoragePath(prefix, file);
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed for ${bucketName}: ${uploadError.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(storagePath);

  return {
    bucket: bucketName,
    path: storagePath,
    url: urlData?.publicUrl || null,
    fileName: file.originalname,
  };
};

const uploadDoctorCertificate = (file, folderLabel) => uploadBuffer({
  bucketName: CERTIFICATE_BUCKET,
  prefix: `${folderLabel || 'unknown'}/certificates`,
  file,
});

const uploadDoctorSignature = (file, folderLabel) => uploadBuffer({
  bucketName: SIGNATURE_BUCKET,
  prefix: `${folderLabel || 'unknown'}/signatures`,
  file,
});

module.exports = {
  uploadDoctorCertificate,
  uploadDoctorSignature,
  CERTIFICATE_BUCKET,
  SIGNATURE_BUCKET,
};