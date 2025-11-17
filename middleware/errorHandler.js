// middleware/errorHandler.js

/** Error Handler Middleware */

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Xử lý lỗi Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Lỗi xác thực dữ liệu',
      errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    return res.status(409).json({
      success: false,
      message: `${field} đã tồn tại`,
      field
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không tồn tại'
    });
  }

  // Xử lý lỗi JSON Parse
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Request body không hợp lệ'
    });
  }

  // Xử lý lỗi Not Found
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Không tìm thấy tài nguyên'
    });
  }

  // Xử lý lỗi Unauthorized
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực'
    });
  }

  // Xử lý lỗi Forbidden
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }

  // Lỗi mặc định
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async Wrapper để bắt lỗi trong async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware kiểm tra 404
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} không tồn tại`, 404);
  next(err);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};
