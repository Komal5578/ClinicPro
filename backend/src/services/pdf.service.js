
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // ← must be first
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
);
const fs = require('fs');

const PDFDocument = require('pdfkit');

const DEFAULT_CLINIC_NAME = 'Sunrise Family Clinic';
const OUTPUT_DIR = path.join(__dirname, '../../generated/pdfs');

const ensureOutputDir = async () => {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
};

const formatDate = (value = new Date()) => {
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getContentWidth = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;

const ensureSpace = (doc, requiredHeight) => {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + requiredHeight > bottomLimit) {
    doc.addPage();
  }
};

const drawInfoBox = (doc, rows) => {
  const boxX = doc.page.margins.left;
  const boxW = getContentWidth(doc);
  const labelW = 120;
  const padding = 12;
  const valueW = boxW - padding * 2 - labelW;

  let boxContentH = 0;
  rows.forEach((row) => {
    const valueH = doc.heightOfString(String(row.value || '-'), {
      width: valueW,
      align: 'left',
    });
    boxContentH += Math.max(16, valueH) + 6;
  });

  const boxH = boxContentH + padding * 2;
  ensureSpace(doc, boxH + 10);

  const startY = doc.y;
  doc.roundedRect(boxX, startY, boxW, boxH, 10).strokeColor('#dbeafe').lineWidth(1).stroke();

  let rowY = startY + padding;
  rows.forEach((row) => {
    const label = row.label || '-';
    const value = String(row.value || '-');
    const valueH = doc.heightOfString(value, { width: valueW });
    const rowH = Math.max(16, valueH);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(label, boxX + padding, rowY, {
      width: labelW,
      align: 'left',
    });

    doc.font('Helvetica').fontSize(11).fillColor('#334155').text(value, boxX + padding + labelW, rowY, {
      width: valueW,
      align: 'left',
    });

    rowY += rowH + 6;
  });

  doc.y = startY + boxH + 10;
};

const drawRandomSignature = (doc, doctorName) => {
  const name = String(doctorName || 'Doctor').replace(/^Dr\.?\s*/i, '').trim() || 'Doctor';
  const parts = name.split(/\s+/).filter(Boolean);
  const seed = Math.floor(Math.random() * 9000) + 1000;
  const shortName = parts.length > 1
    ? `${parts[0][0] || ''}${parts[1] || ''}`
    : parts[0];
  const signatureText = `${shortName}${seed.toString().slice(-2)}`;

  const signX = doc.page.margins.left + 4;
  const signY = doc.y + 2;

  doc.font('Helvetica-Oblique').fontSize(18).fillColor('#0f766e').text(signatureText, signX, signY);

  const curveY = signY + 20;
  const curveStart = signX;
  const c1x = curveStart + 35;
  const c2x = curveStart + 95;
  const endX = curveStart + 150;
  const wobble = Math.floor(Math.random() * 8) + 2;

  doc
    .moveTo(curveStart, curveY)
    .bezierCurveTo(c1x, curveY - wobble, c2x, curveY + wobble, endX, curveY - 1)
    .lineWidth(1.1)
    .strokeColor('#0f766e')
    .stroke();

  doc.y = signY + 30;
};

const generatePrescriptionPdf = async ({
  prescriptionId,
  clinicName = DEFAULT_CLINIC_NAME,
  doctorName = 'Dr. Unknown',
  speciality = 'General Medicine',
  patientName = 'Patient',
  patientAge = null,
  patientPhone = '',
  chiefComplaint = '',
  diagnosisNote = '',
  followupInstructions = '',
  items = [],
  createdAt = new Date(),
}) => {
  await ensureOutputDir();

  const fileName = `prescription_${prescriptionId}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  const fileUrl = `/pdfs/${fileName}`;

 return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 44, size: 'A4' });
    const chunks = [];

    // Collect buffer instead of writing to disk
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const fileName = `prescription_${prescriptionId}.pdf`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('prescriptions')
          .getPublicUrl(fileName);

        resolve({ fileName, filePath: publicUrl, fileUrl: publicUrl });
      } catch (err) {
        reject(err);
      }
    });
    doc.on('error', reject);

    // ... all your existing doc drawing code stays exactly the same ...
    doc.end();
  });
};

module.exports = { generatePrescriptionPdf, DEFAULT_CLINIC_NAME };