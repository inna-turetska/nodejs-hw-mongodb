import Joi from 'joi';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(20).required().messages({
    'string.base': 'Username should be a string',
    'string.min': 'Username should have at least 3 characters',
    'string.max': 'Username should have at most 20 characters',
    'any.required': 'Username is required!',
  }),
  email: Joi.string().email().required(),

  password: Joi.string().required(),
});

export const logInUserSchema = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().required(),
});

export const requestResetEmailSchems = Joi.object({
  email: Joi.string().email().required(),
});

export const reserPasswordSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});
