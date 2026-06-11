const multer = require('multer');

const path = require('path');

const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.mimetype.split('/')[0];

    let folder = 'uploads/files';

    if (type === 'image') {
      folder = 'uploads/images';
    }

    if (type === 'video') {
      folder = 'uploads/videos';
    }

    if (type === 'audio') {
      folder = 'uploads/audio';
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/png',
    'image/jpeg',
    'video/mp4',
    'audio/mpeg',
    'application/pdf',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
