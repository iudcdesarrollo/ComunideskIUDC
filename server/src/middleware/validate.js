const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      const details = error.errors || [];
      res.status(400).json({
        error: 'Datos inválidos',
        details: details
      });
    }
  };
};

export default validate;
