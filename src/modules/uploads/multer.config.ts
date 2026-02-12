import { memoryStorage } from 'multer';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] as const;

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      allowedMimeTypes.includes(
        file.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/svg+xml',
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error('Файл не является изображением!'), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
};
