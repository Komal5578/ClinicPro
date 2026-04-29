const https = require('https');
const { GST_API_KEY, GST_API_HOST } = require('../config/env');

const getJson = ({ hostname, path, headers }) => new Promise((resolve, reject) => {
	const req = https.request(
		{
			hostname,
			port: 443,
			path,
			method: 'GET',
			headers,
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
	req.end();
});

const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const isVerifiedStatus = (status) => /active|valid|registered|found/i.test(String(status || ''));

const verifyGstReal = async (gstin) => {
	if (!GST_API_KEY || !GST_API_HOST) {
		throw new Error('GST API configuration missing. Add GST_API_KEY and GST_API_HOST in backend .env');
	}

	const raw = await getJson({
		hostname: GST_API_HOST,
		path: `/check/${GST_API_KEY}/${encodeURIComponent(gstin)}`,
		headers: {
			'User-Agent': 'ClinicPro/1.0',
		},
	});

	const verified = raw?.flag === true;
	if (!verified) {
		throw new Error(`GST validation failed: ${raw?.message || 'Unknown error'}`);
	}

	const data = raw?.data || {};

	return {
		gst_number: gstin,
		business_name: data?.lgnm || data?.bnm || data?.tradeName || '',
		address: data?.pradr?.adr || data?.pradr?.addr || data?.address || '',
		state: data?.stcd || 'Unknown',
		status: raw?.sts || 'Active',
		verified: true,
		raw,
	};
};

module.exports = { verifyGstReal };
