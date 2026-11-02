const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const optionalText = (max) => Joi.string().trim().max(max).allow('');

const registerSchema = Joi.object({
  restaurant_name: Joi.string().min(3).max(100).trim().required(),
  owner_name: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(72) // bcrypt ignores everything past 72 bytes
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain at least one letter and one number' }),
  phone: optionalText(30).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().max(72).required()
});

const profileSchema = Joi.object({
  restaurant_name: Joi.string().min(3).max(100).trim(),
  owner_name: Joi.string().min(2).max(50).trim(),
  email: Joi.string().email().lowercase().trim(),
  phone: optionalText(30),
  address: optionalText(200),
  description: optionalText(500),
}).min(1);

const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  description: optionalText(200),
  emoji_icon: optionalText(8),
  display_order: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
});

const categoryUpdateSchema = categorySchema.fork(['name'], (s) => s.optional()).min(1);

const categoryReorderSchema = Joi.object({
  order: Joi.array().items(objectId).min(1).unique().required(),
});

const menuItemSchema = Joi.object({
  category_id: objectId.required(),
  name: Joi.string().trim().min(2).max(100).required(),
  description: optionalText(500),
  price: Joi.number().positive().precision(2).max(1000000).required(),
  emoji_icon: optionalText(8),
  image_url: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).allow(''),
  allergens: Joi.array().items(Joi.string().trim().max(40)).max(20),
  dietary_tags: Joi.array().items(Joi.string().trim().max(40)).max(20),
  preparation_time: Joi.number().positive().integer().max(600),
  is_available: Joi.boolean(),
  is_featured: Joi.boolean(),
});

const menuItemUpdateSchema = menuItemSchema
  .fork(['category_id', 'name', 'price'], (s) => s.optional())
  .min(1);

const orderSchema = Joi.object({
  restaurant_id: objectId.required(),
  customer_name: Joi.string().trim().max(50).allow(''),
  customer_phone: Joi.string().trim().max(30).allow(''),
  customer_email: Joi.string().email().trim().allow(''),
  table_number: Joi.string().trim().max(20).allow(''),
  special_instructions: optionalText(500),
  items: Joi.array().items(
    Joi.object({
      menu_item_id: objectId.required(),
      quantity: Joi.number().integer().min(1).max(50).required(),
      special_instructions: optionalText(200)
    })
  ).min(1).max(50).required()
});

const orderStatusSchema = Joi.object({
  status: Joi.string().valid('accepted', 'preparing', 'ready', 'completed', 'cancelled').required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  profileSchema,
  categorySchema,
  categoryUpdateSchema,
  categoryReorderSchema,
  menuItemSchema,
  menuItemUpdateSchema,
  orderSchema,
  orderStatusSchema,
};
