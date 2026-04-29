const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/generateToken');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET } = require('../config/env');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Preferred: verify with Supabase Admin (service role key)
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data || !data.user) throw error || new Error('Invalid token');
      req.user = data.user;
      return next();
    }

    // Next: verify JWT signature using Supabase project's JWT secret
    if (SUPABASE_JWT_SECRET) {
      const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
      req.user = decoded;
      return next();
    }

    // Fallback: legacy local JWT verification
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    console.log('Token verification error:', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };