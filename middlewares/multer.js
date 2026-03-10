const multer = require('multer');

const ALLOWED_MIMES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  // Videos
  'video/mp4', 'video/quicktime', 'video/webm',
  // Audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 100 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  },
});

module.exports = upload;