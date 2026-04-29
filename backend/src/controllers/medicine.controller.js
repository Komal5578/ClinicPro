const { analyzeMedicineImage } = require('../services/medicineAi.service');

const medicines = {
  paracetamol: {
    generic: 'Paracetamol (Acetaminophen)',
    use: 'Pain relief, fever reduction',
    dosage: '500mg every 4-6 hours',
    sideEffects: 'Nausea, liver damage in high doses',
    prescription: false,
  },
  amoxicillin: {
    generic: 'Amoxicillin',
    use: 'Bacterial infections (ear, throat, urinary)',
    dosage: '250-500mg every 8 hours',
    sideEffects: 'Diarrhea, rash, nausea',
    prescription: true,
  },
  azithromycin: {
    generic: 'Azithromycin',
    use: 'Respiratory infections, skin infections',
    dosage: '500mg day 1, then 250mg for 4 days',
    sideEffects: 'Stomach pain, diarrhea, dizziness',
    prescription: true,
  },
  cetirizine: {
    generic: 'Cetirizine (Zyrtec)',
    use: 'Allergies, hay fever, hives',
    dosage: '10mg once daily',
    sideEffects: 'Drowsiness, dry mouth, fatigue',
    prescription: false,
  },
  omeprazole: {
    generic: 'Omeprazole (Prilosec)',
    use: 'Acid reflux, gastric ulcers',
    dosage: '20mg once daily before meals',
    sideEffects: 'Headache, nausea, vitamin B12 deficiency',
    prescription: false,
  },
  metformin: {
    generic: 'Metformin',
    use: 'Type 2 diabetes management',
    dosage: '500mg twice daily with meals',
    sideEffects: 'Nausea, diarrhea, metallic taste',
    prescription: true,
  },
  ibuprofen: {
    generic: 'Ibuprofen (Advil)',
    use: 'Pain, inflammation, fever',
    dosage: '200-400mg every 4-6 hours',
    sideEffects: 'Stomach ulcers, kidney issues, bleeding risk',
    prescription: false,
  },
  amlodipine: {
    generic: 'Amlodipine (Norvasc)',
    use: 'High blood pressure, angina',
    dosage: '5mg once daily',
    sideEffects: 'Swelling, dizziness, flushing',
    prescription: true,
  },
  pantoprazole: {
    generic: 'Pantoprazole (Protonix)',
    use: 'GERD, stomach ulcers',
    dosage: '40mg once daily before breakfast',
    sideEffects: 'Headache, diarrhea, joint pain',
    prescription: true,
  },
  'dolo 650': {
    generic: 'Paracetamol 650mg',
    use: 'Fever, mild to moderate pain',
    dosage: '1 tablet every 4-6 hours, max 4/day',
    sideEffects: 'Rare at normal doses. Liver damage if overdosed',
    prescription: false,
  },
  crocin: {
    generic: 'Paracetamol 500mg',
    use: 'Fever and pain relief',
    dosage: '1-2 tablets every 4-6 hours',
    sideEffects: 'Generally safe. Avoid with alcohol',
    prescription: false,
  },
  monteleukast: {
    generic: 'Montelukast (Singulair)',
    use: 'Asthma prevention, allergic rhinitis',
    dosage: '10mg once daily at bedtime',
    sideEffects: 'Headache, abdominal pain, mood changes',
    prescription: true,
  },
};

const lookupMedicine = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Medicine name is required' });

  const searchKey = name.toLowerCase().trim();

  if (medicines[searchKey]) {
    return res.json({ found: true, medicine: { name: searchKey, ...medicines[searchKey] } });
  }

  const match = Object.keys(medicines).find((k) => k.includes(searchKey) || searchKey.includes(k));
  if (match) {
    return res.json({ found: true, medicine: { name: match, ...medicines[match] } });
  }

  res.json({
    found: false,
    message: 'Medicine not found in our database. Please consult your doctor for information about this medicine.',
  });
};

const ocrMedicine = async (req, res) => {
  console.log('[OCR Medicine] Request received');
  console.log('[OCR Medicine] File info:', {
    exists: !!req.file,
    hasBuffer: !!req.file?.buffer,
    size: req.file?.buffer?.length,
    mimetype: req.file?.mimetype,
    originalname: req.file?.originalname,
  });

  if (!req.file || !req.file.buffer) {
    console.error('[OCR Medicine] File or buffer missing');
    return res.status(400).json({ message: 'Medicine photo is required' });
  }

  try {
    console.log('[OCR Medicine] Converting buffer to base64...');
    const imageBase64 = req.file.buffer.toString('base64');
    console.log('[OCR Medicine] Base64 size:', imageBase64.length);

    console.log('[OCR Medicine] Calling analyzeMedicineImage...');
    const analysis = await analyzeMedicineImage({
      imageBase64,
      mimeType: req.file.mimetype,
    });

    console.log('[OCR Medicine] Analysis successful:', analysis);
    res.json({
      ...analysis,
      found: true,
      message: analysis.analysis?.summary || 'Analysis complete',
    });
  } catch (err) {
    console.error('[OCR Medicine] Error caught:', err.message);
    console.error('[OCR Medicine] Full error stack:', err.stack);

    if (err.message.includes('429')) {
      return res.status(429).json({
        message: 'AI service quota exceeded. Please try again later.',
        error: 'QUOTA_EXCEEDED',
      });
    }

    res.status(500).json({
      message: 'Server error analyzing medicine image',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
};

module.exports = { lookupMedicine, ocrMedicine };