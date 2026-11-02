const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const details = {};
    error.details.forEach((err) => {
      details[err.context.key] = err.message;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details
      }
    });
  }
  
  next();
};

module.exports = validate;
