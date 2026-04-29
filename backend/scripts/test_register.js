(async () => {
  try {
    const payload = {
      name: 'Test Doctor API',
      email: `testdoctor+api${Date.now()}@example.com`,
      phone: '9999000011',
      password: 'TestPass123!',
      sector: 'GENERAL',
      registrationType: 'MCI',
      registrationNumber: 'MHAPI' + Date.now().toString().slice(-6),
      slotDuration: 20,
      morningStart: '09:00',
      morningEnd: '13:00',
      eveningStart: '17:00',
      eveningEnd: '20:00',
      gst_number: '27AAGP09012Q1Z4',
      clinic_name: 'API Test Clinic',
      address: '123 API Test Street, Mumbai'
    };

    const res = await fetch('http://localhost:5000/api/register/doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during test registration:', err.message);
  }
})();
