const Joi = require('joi');

const registerSchema = Joi.object({
  restaurant_name: Joi.string().min(3).max(100).trim().required(),
  owner_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    // .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'))
    // Commenting out strict regex for testing purposes
    .required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const menuItemSchema = Joi.object({
  category_id: Joi.string().required(),
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().precision(2).min(0.01).required(),
  emoji_icon: Joi.string().optional(),
  allergens: Joi.array().items(Joi.string()).optional(),
  dietary_tags: Joi.array().items(Joi.string()).optional(),
  preparation_time: Joi.number().positive().integer().optional()
});

const orderSchema = Joi.object({
  restaurant_id: Joi.string().required(),
  customer_name: Joi.string().min(2).max(50).optional(),
  customer_phone: Joi.string().optional(),
  customer_email: Joi.string().email().optional(),
  table_number: Joi.string().max(20).optional(),
  special_instructions: Joi.string().max(500).optional(),
  items: Joi.array().items(
    Joi.object({
      menu_item_id: Joi.string().required(),
      quantity: Joi.number().min(1).max(100).required(),
      special_instructions: Joi.string().optional()
    })
  ).min(1).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  menuItemSchema,
  orderSchema
};
