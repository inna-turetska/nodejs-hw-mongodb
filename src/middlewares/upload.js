import multer from 'multer';
import path from 'node:path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('src', 'temp'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({ storage });
