const jwt = require('jsonwebtoken');
const { User } = require('../models');

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

const sanitizeUser = (user) => {
  const data = typeof user.toJSON === 'function' ? user.toJSON() : user;
  if (data && Object.prototype.hasOwnProperty.call(data, 'password')) {
    delete data.password;
  }
  return data;
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, location_lat, location_lng } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (role && !['user', 'merchant'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const resolvedRole = role || 'user';
    const isVerified = resolvedRole === 'user';

    const existing = await User.unscoped().findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: resolvedRole,
      phone,
      address,
      location_lat,
      location_lng,
      verified: isVerified,
    });

    const response = { user: sanitizeUser(user) };
    if (isVerified) {
      response.token = signToken(user);
    } else {
      response.message = 'Merchant registration pending verification';
    }
    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.unscoped().findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'merchant' && !user.verified) {
      return res.status(403).json({ message: 'Merchant account pending verification' });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  me,
};
