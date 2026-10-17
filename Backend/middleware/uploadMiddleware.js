const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.usuario?.id || 'anon';
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

// Validación de tipo de archivo permitido (solo imágenes)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedExtensions.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo se permiten imágenes (JPEG, JPG, PNG, WEBP).'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Máximo 3MB
  fileFilter: fileFilter
});

module.exports = upload;