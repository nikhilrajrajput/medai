const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, ''));
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
    }),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  verifyOtp: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required().messages({
      'string.length': 'OTP must be exactly 6 digits',
    }),
  }),
  resendOtp: Joi.object({
    email: Joi.string().email().required(),
  }),
  medication: Joi.object({
    medicationName: Joi.string().min(2).max(100).required(),
  }),
};

module.exports = { validate, schemas };