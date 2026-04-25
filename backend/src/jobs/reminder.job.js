const https = require('https');
const cron = require('node-cron');
const db = require('../config/db');
const {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
	TWILIO_WHATSAPP_FROM,
	TWILIO_CONTENT_SID,
} = require('../config/env');

const normalizeToWhatsApp = (phone) => {
	if (!phone) return null;

	const trimmed = String(phone).trim();
	const digits = trimmed.replace(/\D/g, '');
	if (!digits) return null;

	if (trimmed.startsWith('+')) {
		return `whatsapp:${trimmed}`;
	}

	// Default to India country code if a 10-digit number is stored.
	if (digits.length === 10) {
		return `whatsapp:+91${digits}`;
	}

	return `whatsapp:+${digits}`;
};

const sendTemplateMessage = ({ to, contentSid, contentVariables }) => new Promise((resolve, reject) => {
	const payload = new URLSearchParams({
		To: to,
		From: TWILIO_WHATSAPP_FROM,
		ContentSid: contentSid,
		ContentVariables: JSON.stringify(contentVariables),
	}).toString();

	const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

	const req = https.request(
		{
			hostname: 'api.twilio.com',
			port: 443,
			path: `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
			method: 'POST',
			headers: {
				Authorization: `Basic ${auth}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(payload),
			},
		},
		(res) => {
			let responseBody = '';

			res.on('data', (chunk) => {
				responseBody += chunk;
			});

			res.on('end', () => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(responseBody);
					return;
				}
				reject(new Error(`Twilio API error (${res.statusCode}): ${responseBody}`));
			});
		}
	);

	req.on('error', reject);
	req.write(payload);
	req.end();
});

const processDueReminders = async () => {
	if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !TWILIO_CONTENT_SID) {
		return;
	}

	const [reminders] = await db.query(
		`SELECT r.reminder_id, r.reminder_type, r.scheduled_for, p.name AS patient_name, p.phone
		 FROM Reminder r
		 JOIN Patient p ON p.patient_id = r.patient_id
		 WHERE r.sent = FALSE AND r.scheduled_for <= NOW()
		 ORDER BY r.scheduled_for ASC
		 LIMIT 25`
	);

	for (const reminder of reminders) {
		const to = normalizeToWhatsApp(reminder.phone);
		if (!to) continue;

		const scheduledText = new Date(reminder.scheduled_for).toLocaleString('en-IN', {
			timeZone: 'Asia/Kolkata',
			dateStyle: 'medium',
			timeStyle: 'short',
		});

		const variables = {
			1: reminder.patient_name || 'Patient',
			2: scheduledText,
		};

		try {
			await sendTemplateMessage({
				to,
				contentSid: TWILIO_CONTENT_SID,
				contentVariables: variables,
			});

			await db.query(
				`UPDATE Reminder
				 SET sent = TRUE, sent_at = NOW(), message_txt = COALESCE(message_txt, ?)
				 WHERE reminder_id = ?`,
				[`${reminder.reminder_type} reminder sent via WhatsApp`, reminder.reminder_id]
			);
		} catch (err) {
			console.error(`Reminder ${reminder.reminder_id} failed:`, err.message);
		}
	}
};

let reminderJobStarted = false;

const startReminderJob = () => {
	if (reminderJobStarted) return;
	reminderJobStarted = true;

	cron.schedule('* * * * *', () => {
		processDueReminders().catch((err) => {
			console.error('Reminder job error:', err.message);
		});
	});

	console.log('Reminder job started (runs every minute)');
};

module.exports = { startReminderJob, processDueReminders };
