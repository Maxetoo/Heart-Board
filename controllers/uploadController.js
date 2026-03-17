// const { uploadToCloudinary } = require('../services/cloudinaryUpload');
// const CustomError = require('../error');
// const { StatusCodes } = require('http-status-codes');
// const fs = require('fs').promises;

// const ALLOWED_TYPES = {
//   image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
//   video: ['video/mp4', 'video/quicktime', 'video/webm'],
//   audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'],
// };

// const MAX_SIZES = {
//   image: 10  * 1024 * 1024,  
//   video: 100 * 1024 * 1024,  
//   audio: 20  * 1024 * 1024,  
// };
 

// const uploadFile = async (req, res) => {
//   let { type } = req.body;

//   if (!req.files || !req.files.file) {
//     throw new CustomError.BadRequestError('No file provided.');
//   }

//   const file = req.files.file;
//   const { mimetype, size, tempFilePath } = file;

//   try {
//     // Auto-detect type from MIME if not provided
//     if (!type) {
//       if (mimetype.startsWith('image/')) type = 'image';
//       else if (mimetype.startsWith('video/')) type = 'video';
//       else if (mimetype.startsWith('audio/')) type = 'audio';
//     }

//     if (!['image', 'video', 'audio'].includes(type)) {
//       throw new CustomError.BadRequestError('type must be image, video, or audio.');
//     }

//     // Ensure the detected/provided type actually matches an allowed MIME
//     if (!ALLOWED_TYPES[type].includes(mimetype)) {
//       throw new CustomError.BadRequestError(
//         `Invalid file type for ${type}. Allowed: ${ALLOWED_TYPES[type].join(', ')}`
//       );
//     }

//     if (size > MAX_SIZES[type]) {
//       throw new CustomError.BadRequestError(
//         `File too large. Max size for ${type} is ${MAX_SIZES[type] / (1024 * 1024)}MB.`
//       );
//     }

//     const result = await uploadToCloudinary(tempFilePath, type);

//     res.status(StatusCodes.OK).json({
//       message: 'Upload successful.',
//       type,
//       ...result,
//     });
//   } finally {
//     // Clean up the temporary file
//     try {
//       await fs.unlink(tempFilePath);
//       console.log('Temp file deleted:', tempFilePath);
//     } catch (error) {
//       console.error('Error deleting temp file:', error.message);
//     }
//   }
// };

// module.exports = { uploadFile };


const { uploadToCloudinary } = require('../services/cloudinaryUpload');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs').promises;

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/x-m4a'],
};

const MAX_SIZES = {
  image: 10  * 1024 * 1024,  
  video: 100 * 1024 * 1024,  
  audio: 20  * 1024 * 1024,  
};
 

const uploadFile = async (req, res) => {
  let { type } = req.body;

  if (!req.files || !req.files.file) {
    throw new CustomError.BadRequestError('No file provided.');
  }

  const file = req.files.file;
  const { mimetype, size, tempFilePath } = file;

  try {
    // Auto-detect type from MIME if not provided
    if (!type) {
      if (mimetype.startsWith('image/')) type = 'image';
      else if (mimetype.startsWith('video/')) type = 'video';
      else if (mimetype.startsWith('audio/')) type = 'audio';
    }

    if (!['image', 'video', 'audio'].includes(type)) {
      throw new CustomError.BadRequestError('type must be image, video, or audio.');
    }

    // Ensure the detected/provided type actually matches an allowed MIME
    if (!ALLOWED_TYPES[type].includes(mimetype)) {
      throw new CustomError.BadRequestError(
        `Invalid file type for ${type}. Allowed: ${ALLOWED_TYPES[type].join(', ')}`
      );
    }

    if (size > MAX_SIZES[type]) {
      throw new CustomError.BadRequestError(
        `File too large. Max size for ${type} is ${MAX_SIZES[type] / (1024 * 1024)}MB.`
      );
    }

    const result = await uploadToCloudinary(tempFilePath, type);

    res.status(StatusCodes.OK).json({
      message: 'Upload successful.',
      type,
      ...result,
    });
  } finally {
    // Clean up the temporary file
    try {
      await fs.unlink(tempFilePath);
      console.log('Temp file deleted:', tempFilePath);
    } catch (error) {
      console.error('Error deleting temp file:', error.message);
    }
  }
};

module.exports = { uploadFile };