const errorHandler = (err, req, res, next) => {
  // Always log errors so they appear in Railway logs
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (err.stack) console.error(err.stack);

  // Determine status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Send error response
  res.status(status).json({
    error: message
  });
};

export default errorHandler;
