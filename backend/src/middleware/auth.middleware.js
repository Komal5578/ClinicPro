const { verifyToken } = require('../utils/generateToken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  console.log('Auth header received:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };