const fs = require('fs');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');

const DEFAULT_CLINIC_NAME = 'ClinicPro Health Center';
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

const addLabelValue = (doc, label, value) => {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`${label}: `, {
    continued: true,
  });
  doc.font('Helvetica').fillColor('#334155').text(value || '-');
};

const fetchImageBuffer = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(response.data);
  } catch {
    return null;
  }
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
  doctorSignatureUrl = null,
}) => {
  await ensureOutputDir();
  const signatureBuffer = doctorSignatureUrl ? await fetchImageBuffer(doctorSignatureUrl) : null;

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

    doc.moveDown(1.2);

    doc.roundedRect(doc.x, doc.y, 507, 84, 10).strokeColor('#dbeafe').lineWidth(1).stroke();
    doc.moveDown(0.7);
    addLabelValue(doc, 'Doctor', doctorName);
    addLabelValue(doc, 'Speciality', speciality);
    addLabelValue(doc, 'Generated On', formatDate(createdAt));

    doc.moveDown(0.4);
    doc.roundedRect(doc.x, doc.y, 507, 88, 10).strokeColor('#dbeafe').lineWidth(1).stroke();
    doc.moveDown(0.7);
    addLabelValue(doc, 'Patient', patientName);
    addLabelValue(doc, 'Age', patientAge != null ? String(patientAge) : '-');
    addLabelValue(doc, 'Phone', patientPhone || '-');

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Consultation Summary');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#334155').text(`Chief Complaint: ${chiefComplaint || '-'}`);
    doc.moveDown(0.2);
    doc.text(`Diagnosis / Voice-to-text Notes: ${diagnosisNote || '-'}`);
    doc.moveDown(0.2);
    doc.text(`Follow-up Instructions: ${followupInstructions || '-'}`);

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Prescription');
    doc.moveDown(0.4);

    if (!items.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#334155').text('No medicines prescribed.');
    } else {
      items.forEach((item, index) => {
        doc.roundedRect(doc.x, doc.y, 507, 48, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(0.45);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`${index + 1}. ${item.medicine_name || 'Medicine'}`);
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text(
          `Dosage: ${item.dosage || '-'} | Frequency: ${item.frequency || '-'} | Duration: ${item.duration_days || '-'} days${item.notes ? ` | Notes: ${item.notes}` : ''}`
        );
        doc.moveDown(0.4);
      });
    }

    doc.moveDown(1.1);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Doctor Signature');
    doc.moveDown(0.2);
    if (signatureBuffer) {
      try {
        doc.image(signatureBuffer, doc.x, doc.y, { fit: [180, 60] });
        doc.moveDown(3.2);
      } catch {
        doc.moveTo(doc.x, doc.y + 20).lineTo(doc.x + 180, doc.y + 20).strokeColor('#94a3b8').stroke();
        doc.moveDown(0.35);
      }
    } else {
      doc.moveTo(doc.x, doc.y + 20).lineTo(doc.x + 180, doc.y + 20).strokeColor('#94a3b8').stroke();
      doc.moveDown(0.35);
    }
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(doctorName);
    doc.text(`${speciality}`, { continued: false });

    doc.moveDown(1.2);
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