const jwt = require('jsonwebtoken');
const { User } = require('../models');

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
};

const authenticate = async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = {
  authenticate,
  authorizeRoles,
};
