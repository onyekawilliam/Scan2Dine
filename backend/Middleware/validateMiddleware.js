// Validates req.body against a Joi schema and replaces it with the cleaned value
// (trimmed, lowercased, unknown fields stripped), so controllers never see raw input.
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const details = {};
    error.details.forEach((err) => {
      details[err.context.key] = err.message;
    });

    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      error: {
        code: "VALIDATION_ERROR",
        message: error.details[0].message,
        details,
      },
    });
  }

  req.body = value;
  next();
};

module.exports = validate;
