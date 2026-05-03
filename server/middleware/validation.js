const Joi = require('joi');

const validate = (schema, body) => {
  const { error } = schema.validate(body, { abortEarly: false });
  if (error) {
    return error.details.map((d) => d.message.replace(/"/g, ''));
  }
  return null;
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
  medication: Joi.object({
    medicationName: Joi.string().min(2).max(100).required(),
  }),
};

module.exports = { validate, schemas };