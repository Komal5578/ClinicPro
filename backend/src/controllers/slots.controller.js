const db = require('../config/db');

const parseTime = (timeValue) => {
  const [hours = 0, minutes = 0] = String(timeValue || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutesTotal) => {
  const normalized = ((minutesTotal % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

const buildPattern = (bookedCount, walkinCount) => {
  const pattern = [];
  const booked = Math.max(1, Number(bookedCount) || 1);
  const walkins = Math.max(0, Number(walkinCount) || 0);
  for (let i = 0; i < booked; i += 1) pattern.push('BOOKED');
  for (let i = 0; i < walkins; i += 1) pattern.push('WALKIN');
  return pattern.length ? pattern : ['BOOKED'];
};

const generateSlotRows = (params) => {
  const rows = [];
  let token = 1;

  const addRange = (startTime, endTime, pattern, bookedDuration, walkinDuration) => {
    let cursor = parseTime(startTime);
    const end = parseTime(endTime);
    let patternIndex = 0;

    while (cursor < end) {
      const slotType = pattern[patternIndex % pattern.length];
      const duration = slotType === 'WALKIN' ? walkinDuration : bookedDuration;
      if (cursor + duration > end) break;

      rows.push({
        clinic_id: params.clinic_id,
        slot_date: params.date,
        slot_start_time: formatTime(cursor),
        slot_type: slotType,
        status: 'OPEN',
        token_number: token,
      });

      cursor += duration;
      patternIndex += 1;
      token += 1;
    }
  };

  const bookedPattern = buildPattern(Number(params.walkin_to_booked_ratio) || 3, 1);
  addRange(params.morning_start, params.morning_end, bookedPattern, Number(params.booked_duration) || 20, Number(params.walkin_duration) || 15);

  if (params.evening_start && params.evening_end) {
    const gapStart = parseTime(params.morning_end);
    const gapEnd = parseTime(params.evening_start);
    let cursor = gapStart;
    while (cursor + 15 <= gapEnd) {
      rows.push({
        clinic_id: params.clinic_id,
        slot_date: params.date,
        slot_start_time: formatTime(cursor),
        slot_type: 'BUFFER',
        status: 'OPEN',
        token_number: token,
      });
      cursor += 15;
      token += 1;
    }
    addRange(params.evening_start, params.evening_end, bookedPattern, Number(params.booked_duration) || 20, Number(params.walkin_duration) || 15);
  }

  return rows;
};

const generateSlots = async (req, res) => {
  const body = req.body || {};
  const clinic_id = body.clinic_id || req.user?.clinic_id;
  const date = body.date;
  const available = body.available !== false;

  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  if (!date) return res.status(400).json({ message: 'date is required' });

  try {
    if (!available) {
      await db.query(
        `INSERT INTO ClinicDailyAvailability (clinic_id, available_date, is_available)
         VALUES (?, ?, 0)
         ON DUPLICATE KEY UPDATE is_available = 0`,
        [clinic_id, date]
      );
      return res.json({ success: true, available: false, message: 'Marked unavailable for the selected date' });
    }

    const [clinicRows] = await db.query(
      'SELECT morning_start, morning_end, evening_start, evening_end FROM Clinic WHERE clinic_id = ?',
      [clinic_id]
    );
    const clinic = clinicRows[0] || {};

    const slots = generateSlotRows({
      clinic_id,
      date,
      morning_start: body.morning_start || clinic.morning_start || '09:00:00',
      morning_end: body.morning_end || clinic.morning_end || '13:00:00',
      evening_start: body.evening_start || clinic.evening_start,
      evening_end: body.evening_end || clinic.evening_end,
      booked_duration: body.booked_duration || 20,
      walkin_duration: body.walkin_duration || 15,
      walkin_to_booked_ratio: body.walkin_to_booked_ratio || 3,
    });

    await db.query('DELETE FROM Slot WHERE clinic_id = ? AND slot_date = ?', [clinic_id, date]);

    for (const slot of slots) {
      await db.query(
        `INSERT INTO Slot (clinic_id, slot_date, slot_start_time, slot_type, status, token_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [slot.clinic_id, slot.slot_date, slot.slot_start_time, slot.slot_type, slot.status, slot.token_number]
      );
    }

    await db.query(
      `INSERT INTO ClinicDailyAvailability (clinic_id, available_date, is_available)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_available = 1`,
      [clinic_id, date]
    );

    await db.query(
      'UPDATE Clinic SET booked_slot_duration = ?, buffer_duration = ? WHERE clinic_id = ?',
      [body.booked_duration || 20, body.walkin_duration || 15, clinic_id]
    );

    res.json({ success: true, available: true, slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateSlots };