/** Response Utility - Standardized API response format */
// Success response
const success = (req, message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path: req?.path || req?.originalUrl || '/',
    statusCode
  };
};

// Error response
const error = (req, message, code = 'INTERNAL_ERROR', statusCode = 500, metadata = {}) => {
  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req?.path || req?.originalUrl || '/'
  };

  // Only include metadata in development
  if (process.env.NODE_ENV === 'development' && metadata && Object.keys(metadata).length > 0) {
    response.metadata = metadata;
  }

  return response;
};

// Validation error response (400)
const validationError = (req, message, fields = {}) => {
  return {
    success: false,
    message,
    code: 'VALIDATION_ERROR',
    fields,
    timestamp: new Date().toISOString(),
    path: req?.path || req?.originalUrl || '/'
  };
};

// Unauthorized error response (401)
const unauthorized = (req, message = 'Unauthorized') => {
  return error(req, message, 'UNAUTHORIZED', 401);
};

// Forbidden error response (403)
const forbidden = (req, message = 'Forbidden') => {
  return error(req, message, 'FORBIDDEN', 403);
};

// Not found error response (404)
const notFound = (req, resource = 'Resource') => {
  return error(req, `${resource} not found`, 'NOT_FOUND', 404);
};

// Conflict error response (409) - usually for duplicate entries
const conflict = (req, message = 'Duplicate entry') => {
  return error(req, message, 'CONFLICT', 409);
};

// Internal server error response (500)
const serverError = (req, message = 'Internal server error') => {
  return error(req, message, 'INTERNAL_SERVER_ERROR', 500);
};

// Paginated response for list endpoints
const paginated = (req, message, data = [], total = 0, page = 1, limit = 10) => {
  const pages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString(),
    path: req?.path || req?.originalUrl || '/'
  };
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  paginated
};
