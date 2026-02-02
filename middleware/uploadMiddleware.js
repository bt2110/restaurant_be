/** Upload Middleware - Handle file uploads with multer */

const multer = require('multer');
const logger = require('./logger');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn('Invalid file type for upload', {
        correlationId: req.correlationId,
        context: { mimetype: file.mimetype, filename: file.originalname }
      });
      cb(new Error('Chỉ hỗ trợ các định dạng: JPEG, PNG, GIF, WebP'));
    }
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Kích thước tệp vượt quá giới hạn 5MB',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều tệp',
        error: 'TOO_MANY_FILES'
      });
    }
  }
  
  if (err) {
    logger.error('Upload error', {
      correlationId: req.correlationId,
      error: err.message
    });
    return res.status(400).json({
      success: false,
      message: err.message || 'Lỗi khi tải lên tệp',
      error: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

module.exports = {
  uploadMiddleware,
  handleUploadError,
  singleImageUpload: uploadMiddleware.single('image'),
  multipleImageUpload: uploadMiddleware.array('images', 10)
};
