const https = require('https');
const { GST_API_KEY, GST_API_HOST } = require('../config/env');

const postJson = ({ hostname, path, headers, body }) => new Promise((resolve, reject) => {
	const payload = JSON.stringify(body);

	const req = https.request(
		{
			hostname,
			port: 443,
			path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload),
				...headers,
			},
		},
		(res) => {
			let responseBody = '';

			res.on('data', (chunk) => {
				responseBody += chunk;
			});

			res.on('end', () => {
				let json = {};
				try {
					json = responseBody ? JSON.parse(responseBody) : {};
				} catch (err) {
					reject(new Error(`GST API returned non-JSON response: ${responseBody}`));
					return;
				}

				if (res.statusCode < 200 || res.statusCode >= 300) {
					reject(new Error(`GST API error (${res.statusCode}): ${responseBody}`));
					return;
				}

				resolve(json);
			});
		}
	);

	req.on('error', reject);
	req.write(payload);
	req.end();
});

const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const verifyGstReal = async (gstin) => {
	if (!GST_API_KEY || !GST_API_HOST) {
		throw new Error('GST API configuration missing. Add GST_API_KEY and GST_API_HOST in backend .env');
	}

	const raw = await postJson({
		hostname: GST_API_HOST,
		path: '/',
		headers: {
			'x-rapidapi-key': GST_API_KEY,
			'x-rapidapi-host': GST_API_HOST,
		},
		body: { gstin },
	});

	const payload = raw?.data || raw?.result || raw;

	const businessName = pick(payload?.business_name, payload?.tradeName, payload?.lgnm, payload?.bnm);
	const address = pick(payload?.address, payload?.adr, payload?.pradr?.addr?.bnm, payload?.pradr?.adr);
	const state = pick(payload?.state, payload?.pradr?.addr?.stcd, payload?.stcd);
	const status = pick(payload?.status, payload?.gst_status, payload?.sts, raw?.message);

	return {
		gst_number: gstin,
		business_name: businessName || 'Unknown Business',
		address: address || 'Address not available',
		state: state || 'Unknown',
		status: status || 'Unknown',
		verified: true,
		raw,
	};
};

module.exports = { verifyGstReal };
