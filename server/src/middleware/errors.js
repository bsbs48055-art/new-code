import { ZodError } from 'zod';

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    details: err.details,
  });
}

export function assertConfigured(condition, message, code = 'CONFIG_ERROR') {
  if (!condition) {
    const err = new Error(message);
    err.status = 503;
    err.code = code;
    throw err;
  }
}
