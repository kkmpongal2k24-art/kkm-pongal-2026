// Cloudinary upload utility for review images
const CLOUD_NAME = "dkxxa3xt0"; // Same as admin project
const UPLOAD_PRESET = "unsigned_preset"; // Same as admin project

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<string>} - Returns Cloudinary URL
 */
export const uploadImageToCloudinary = async (file, folder = "review-images") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  // Add folder if specified
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Return only the URL
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<string[]>} - Returns array of Cloudinary URLs
 */
export const uploadMultipleImagesToCloudinary = async (files, folder = "review-images") => {
  const uploadPromises = files.map(file => uploadImageToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Upload image to Cloudinary with options (for compatibility with Expenses component)
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (optional)
 * @returns {Promise<string>} - Returns Cloudinary URL
 */
export const uploadToCloudinary = async (file, options = {}) => {
  return uploadImageToCloudinary(file, options.folder);
};

export default uploadToCloudinary;
