/** Image Utility - Handle image uploads and storage */

const fs = require('fs');
const path = require('path');
const logger = require('../middleware/logger');

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BRANCHES_DIR = path.join(UPLOADS_DIR, 'branches');
const CATEGORIES_DIR = path.join(UPLOADS_DIR, 'categories');
const ITEMS_DIR = path.join(UPLOADS_DIR, 'items');

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    logger.info('Created uploads directory', { path: UPLOADS_DIR });
  }
  if (!fs.existsSync(BRANCHES_DIR)) {
    fs.mkdirSync(BRANCHES_DIR, { recursive: true });
    logger.info('Created branches uploads directory', { path: BRANCHES_DIR });
  }
  if (!fs.existsSync(CATEGORIES_DIR)) {
    fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
    logger.info('Created categories uploads directory', { path: CATEGORIES_DIR });
  }
  if (!fs.existsSync(ITEMS_DIR)) {
    fs.mkdirSync(ITEMS_DIR, { recursive: true });
    logger.info('Created items uploads directory', { path: ITEMS_DIR });
  }
};

/**
 * Validate image file
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} filename - Original filename
 * @returns {object} { isValid, error }
 */
const validateImageFile = (fileBuffer, filename) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Check file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Kích thước ảnh vượt quá 5MB'
    };
  }

  // Check MIME type by magic bytes
  const mimeType = getMimeType(fileBuffer);
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: 'Định dạng ảnh không được hỗ trợ (JPEG, PNG, GIF, WebP)'
    };
  }

  return { isValid: true };
};

/**
 * Detect MIME type from file buffer (magic bytes)
 * @param {Buffer} buffer
 * @returns {string} MIME type
 */
const getMimeType = (buffer) => {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  // WebP: RIFF...WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }
  return 'application/octet-stream';
};

/**
 * Save branch image to disk
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} branchId - Branch ID for unique naming
 * @returns {string} Relative path to saved image
 */
const saveBranchImage = (fileBuffer, branchId) => {
  try {
    ensureDirectories();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `branch_${branchId}_${timestamp}.jpg`;
    const filepath = path.join(BRANCHES_DIR, filename);

    // Save file
    fs.writeFileSync(filepath, fileBuffer);
    logger.info('Branch image saved successfully', { filepath, branchId });

    // Return relative path for database storage
    return `/uploads/branches/${filename}`;
  } catch (error) {
    logger.error('Error saving branch image', { error, branchId });
    throw new Error('Không thể lưu ảnh');
  }
};

// Generic save for different entity types
const saveImage = (subdir, fileBuffer, id, ext = 'jpg') => {
  try {
    ensureDirectories();

    const timestamp = Date.now();
    const filename = `${subdir.slice(0, -1)}_${id}_${timestamp}.${ext}`;
    let dir = UPLOADS_DIR;
    if (subdir === 'branches') dir = BRANCHES_DIR;
    if (subdir === 'categories') dir = CATEGORIES_DIR;
    if (subdir === 'items') dir = ITEMS_DIR;

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    logger.info('Image saved successfully', { filepath, subdir, id });
    return `/uploads/${subdir}/${filename}`;
  } catch (error) {
    logger.error('Error saving image', { error, subdir, id });
    throw new Error('Không thể lưu ảnh');
  }
};

/**
 * Delete branch image from disk
 * @param {string} imagePath - Relative image path from database
 * @returns {boolean} Success status
 */
const deleteBranchImage = (imagePath) => {
  try {
    if (!imagePath) return true;

    // Convert relative path to absolute
    const absolutePath = path.join(__dirname, '..', imagePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      logger.info('Branch image deleted successfully', { imagePath });
      return true;
    }
    return true;
  } catch (error) {
    logger.error('Error deleting branch image', { error, imagePath });
    // Don't throw - continue even if deletion fails
    return false;
  }
};

const deleteImage = (imagePath) => {
  try {
    if (!imagePath) return true;
    const absolutePath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      logger.info('Image deleted successfully', { imagePath });
      return true;
    }
    return true;
  } catch (error) {
    logger.error('Error deleting image', { error, imagePath });
    return false;
  }
};

/**
 * Update branch image (delete old, save new)
 * @param {Buffer} fileBuffer - New file buffer
 * @param {string} branchId - Branch ID
 * @param {string} oldImagePath - Old image path to delete
 * @returns {string} New image path
 */
const updateBranchImage = (fileBuffer, branchId, oldImagePath) => {
  try {
    // Delete old image
    if (oldImagePath) {
      deleteBranchImage(oldImagePath);
    }

    // Save new image
    return saveBranchImage(fileBuffer, branchId);
  } catch (error) {
    logger.error('Error updating branch image', { error, branchId });
    throw error;
  }
};

const saveCategoryImage = (fileBuffer, categoryId) => saveImage('categories', fileBuffer, categoryId);
const saveItemImage = (fileBuffer, itemId) => saveImage('items', fileBuffer, itemId);
const updateCategoryImage = (fileBuffer, categoryId, oldImagePath) => {
  if (oldImagePath) deleteImage(oldImagePath);
  return saveCategoryImage(fileBuffer, categoryId);
};
const updateItemImage = (fileBuffer, itemId, oldImagePath) => {
  if (oldImagePath) deleteImage(oldImagePath);
  return saveItemImage(fileBuffer, itemId);
};

module.exports = {
  ensureDirectories,
  validateImageFile,
  getMimeType,
  saveBranchImage,
  deleteBranchImage,
  updateBranchImage,
  saveImage,
  deleteImage,
  saveCategoryImage,
  saveItemImage,
  updateCategoryImage,
  updateItemImage,
  UPLOADS_DIR,
  BRANCHES_DIR,
  CATEGORIES_DIR,
  ITEMS_DIR
};

// Build absolute URL for a relative upload path using request info
const getFullUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (!relativePath.startsWith('/uploads')) return relativePath;
  const protocol = req.protocol || 'http';
  const host = req.get && req.get('host') ? req.get('host') : (process.env.HOST || `localhost:${process.env.PORT || 3000}`);
  return `${protocol}://${host}${relativePath}`;
};

// Attach full URLs for any keys ending with '_image' in object/array recursively
// Handles Sequelize instances by operating on `dataValues` and prevents
// infinite recursion using a WeakSet of visited objects.
const attachFullUrls = (obj, req, visited = new WeakSet()) => {
  if (!obj) return obj;

  // Prevent circular recursion
  if (typeof obj === 'object') {
    if (visited.has(obj)) return obj;
    visited.add(obj);
  }

  // If this looks like a Sequelize instance, convert to plain object and
  // re-attach the processed plain object back onto `dataValues` so JSON
  // serialization sends the modified values.
  if (obj && typeof obj.toJSON === 'function') {
    const plain = obj.toJSON();
    attachFullUrls(plain, req, visited);
    try {
      // try to replace dataValues so Express/Sequelize will serialize the modified data
      if (obj.dataValues && typeof obj.dataValues === 'object') {
        obj.dataValues = plain;
      }
    } catch (e) {
      // ignore if we cannot assign
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) attachFullUrls(item, req, visited);
    return obj;
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === 'string' && key.endsWith('_image') && val.startsWith('/uploads')) {
        try { obj[key] = getFullUrl(req, val); } catch (e) { /* ignore */ }
      } else if (val && typeof val === 'object') {
        attachFullUrls(val, req, visited);
      }
    }
  }
  return obj;
};

// Export URL helpers (ensure they're available on require('../utils/imageUtil'))
module.exports.getFullUrl = getFullUrl;
module.exports.attachFullUrls = attachFullUrls;
