/**
 * Client-side Image Handling Helper
 * 
 * Để sử dụng trong frontend application
 * Ví dụ: React, Vue, Angular, etc.
 */

class BranchImageHandler {
  constructor(apiBaseUrl = 'http://localhost:3000', token = null) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  /**
   * Upload ảnh cho chi nhánh
   * @param {number} branchId - ID chi nhánh
   * @param {File} imageFile - File object từ input
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  async uploadImage(branchId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/branches/${branchId}/image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Xóa ảnh chi nhánh
   * @param {number} branchId - ID chi nhánh
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  async deleteImage(branchId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/branches/${branchId}/image`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Delete failed');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Lấy URL ảnh đầy đủ
   * @param {string} relativePath - Đường dẫn tương đối từ API (VD: /uploads/branches/...)
   * @returns {string} URL đầy đủ
   */
  getFullImageUrl(relativePath) {
    if (!relativePath) return null;
    return `${this.apiBaseUrl}${relativePath}`;
  }

  /**
   * Kiểm tra file hợp lệ trước khi upload
   * @param {File} file - File object
   * @returns {{valid: boolean, error: string|null}}
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      return { valid: false, error: 'Chưa chọn tệp' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Định dạng không hỗ trợ. Vui lòng chọn JPEG, PNG, GIF hoặc WebP'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Kích thước tệp (${(file.size / 1024 / 1024).toFixed(2)}MB) vượt quá 5MB`
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Tạo preview ảnh
   * @param {File} file - File object
   * @returns {Promise<string>} Data URL cho preview
   */
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Xử lý upload với progress tracking
   * @param {number} branchId
   * @param {File} imageFile
   * @param {Function} onProgress - Callback: (progress: 0-100) => {}
   * @returns {Promise}
   */
  async uploadImageWithProgress(branchId, imageFile, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress?.(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Upload failed'));
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      // Setup request
      const formData = new FormData();
      formData.append('image', imageFile);

      xhr.open('POST', `${this.apiBaseUrl}/api/branches/${branchId}/image`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(formData);
    });
  }
}

export default BranchImageHandler;

// ============================================================
// VANILLA JAVASCRIPT EXAMPLE (untuk testing)
// ============================================================

/*
// HTML
<div id="uploadSection">
  <input type="file" id="imageInput" accept="image/*" />
  <img id="preview" style="max-width: 200px; margin: 10px 0;" />
  <button id="uploadBtn">Upload</button>
  <div id="progress" style="display: none;">
    <progress id="progressBar" max="100"></progress>
    <span id="progressText">0%</span>
  </div>
  <div id="message"></div>
</div>

// JavaScript
const handler = new BranchImageHandler('http://localhost:3000', 'your_jwt_token');

document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  // Validate
  const { valid, error } = handler.validateImageFile(file);
  if (!valid) {
    alert(error);
    return;
  }

  // Show preview
  const preview = await handler.createImagePreview(file);
  document.getElementById('preview').src = preview;
});

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const file = document.getElementById('imageInput').files[0];
  if (!file) {
    alert('Vui lòng chọn tệp');
    return;
  }

  const progressDiv = document.getElementById('progress');
  progressDiv.style.display = 'block';

  try {
    const result = await handler.uploadImageWithProgress(1, file, (progress) => {
      document.getElementById('progressBar').value = progress;
      document.getElementById('progressText').textContent = progress + '%';
    });

    if (result.success) {
      const fullUrl = handler.getFullImageUrl(result.data.branch_image);
      document.getElementById('preview').src = fullUrl;
      document.getElementById('message').textContent = '✅ ' + result.message;
    } else {
      document.getElementById('message').textContent = '❌ ' + result.message;
    }
  } catch (error) {
    document.getElementById('message').textContent = '❌ ' + error.message;
  } finally {
    progressDiv.style.display = 'none';
  }
});
*/
