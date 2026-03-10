const cloudinary  = require('../configs/cloudinaryConfig');
const CustomError = require('../error');

const RESOURCE_TYPE = {
  image: 'image',
  video: 'video',
  audio: 'video',
};

const FOLDERS = {
  image: 'boardapp/images',
  video: 'boardapp/videos',
  audio: 'boardapp/audios',
};

const uploadToCloudinary = async (tempFilePath, type) => {
    try {
        const uploadOptions = {
    resource_type: RESOURCE_TYPE[type],
    folder: FOLDERS[type],
  };

  if (type === 'image') {
    uploadOptions.fetch_format = 'auto';
    uploadOptions.quality = 'auto';
  }

  if (type === 'video') {
    uploadOptions.eager = [{ format: 'mp4', quality: 'auto' }];
    uploadOptions.eager_async = true;
  }

  if (type === 'audio') {
    uploadOptions.eager = [{ format: 'mp3' }];
    uploadOptions.eager_async = true;
  }

  // Direct upload with the temp file path — no streams, no callbacks
  const result = await cloudinary.uploader.upload(tempFilePath, uploadOptions);

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    format:   result.format,
    bytes:    result.bytes,
    duration: result.duration ?? null,
    width:    result.width    ?? null,
    height:   result.height   ?? null,
  };
    } catch (error) {
        throw new CustomError.BadRequestError(error.message)
    }
};

const deleteFromCloudinary = async (publicId, type) => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: RESOURCE_TYPE[type],
  });
  console.log("Delete initiated with publicId: ", publicId)
};

const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality:      'auto',
    ...options,
  });
};

const getAutoCropUrl = (publicId, width = 500, height = 500) => {
  return cloudinary.url(publicId, {
    crop:    'auto',
    gravity: 'auto',
    width,
    height,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  getAutoCropUrl,
};