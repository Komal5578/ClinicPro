const { verifyToken } = require('../utils/generateToken');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    console.log('Token verification error:', err?.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };