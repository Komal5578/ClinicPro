const fs = require('fs');
const path = require('path');
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
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#0f766e')
      .text(clinicName, { align: 'center' });

    doc
      .moveDown(0.25)
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#64748b')
      .text('Prescription issued by attending doctor', { align: 'center' });

    doc.moveDown(0.8);

    drawInfoBox(doc, [
      { label: 'Doctor', value: doctorName },
      { label: 'Speciality', value: speciality },
      { label: 'Generated On', value: formatDate(createdAt) },
    ]);

    drawInfoBox(doc, [
      { label: 'Patient', value: patientName },
      { label: 'Age', value: patientAge != null ? String(patientAge) : '-' },
      { label: 'Phone', value: patientPhone || '-' },
    ]);

    ensureSpace(doc, 150);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Consultation Summary');
    doc.moveDown(0.35);

    const summaryX = doc.page.margins.left;
    const summaryW = getContentWidth(doc);
    const summaryPad = 12;
    const summaryInnerW = summaryW - summaryPad * 2;
    const summaryText = [
      `Chief Complaint: ${chiefComplaint || '-'}`,
      `Diagnosis: ${diagnosisNote || '-'}`,
      `Follow-up: ${followupInstructions || '-'}`,
    ].join('\n\n');

    const summaryH = doc.heightOfString(summaryText, { width: summaryInnerW }) + summaryPad * 2;
    ensureSpace(doc, summaryH + 16);

    const summaryY = doc.y;
    doc.roundedRect(summaryX, summaryY, summaryW, summaryH, 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.font('Helvetica').fontSize(11).fillColor('#334155').text(summaryText, summaryX + summaryPad, summaryY + summaryPad, {
      width: summaryInnerW,
      align: 'left',
    });
    doc.y = summaryY + summaryH + 14;

    ensureSpace(doc, 140);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Prescription');
    doc.moveDown(0.45);

    if (!items.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#334155').text('No medicines prescribed.');
    } else {
      items.forEach((item, index) => {
        const cardX = doc.page.margins.left;
        const cardW = getContentWidth(doc);
        const cardPad = 10;
        const innerW = cardW - cardPad * 2;

        const title = `${index + 1}. ${item.medicine_name || 'Medicine'}`;
        const detail = [
          `Dosage: ${item.dosage || '-'}`,
          `Frequency: ${item.frequency || '-'}`,
          `Duration: ${item.duration_days || '-'} days`,
          `Notes: ${item.notes || '-'}`,
        ].join(' | ');

        const titleH = doc.heightOfString(title, { width: innerW });
        const detailH = doc.heightOfString(detail, { width: innerW });
        const cardH = cardPad * 2 + titleH + detailH + 6;

        ensureSpace(doc, cardH + 8);
        const cardY = doc.y;
        doc.roundedRect(cardX, cardY, cardW, cardH, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(title, cardX + cardPad, cardY + cardPad, {
          width: innerW,
        });
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text(detail, cardX + cardPad, cardY + cardPad + titleH + 6, {
          width: innerW,
        });

        doc.y = cardY + cardH + 8;
      });
    }

    ensureSpace(doc, 110);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Doctor Signature');
    drawRandomSignature(doc, doctorName);
    doc.moveTo(doc.page.margins.left, doc.y + 2).lineTo(doc.page.margins.left + 180, doc.y + 2).strokeColor('#94a3b8').stroke();
    doc.moveDown(0.55);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(doctorName);
    doc.text(speciality);

    doc.moveDown(0.9);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text(
      'Generated from the consultation notes and prescription entered by the doctor. Voice-to-text supported when used during consultation.',
      { align: 'center' }
    );

    doc.end();

    stream.on('finish', () => resolve({ fileName, filePath, fileUrl }));
    stream.on('error', reject);
  });
};

module.exports = { generatePrescriptionPdf, DEFAULT_CLINIC_NAME };