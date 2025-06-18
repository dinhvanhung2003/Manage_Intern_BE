// task-image-upload.options.ts
import { diskStorage } from 'multer';
import { extname } from 'path';

export const taskImageMulterOptions = {
  storage: diskStorage({
    destination: './uploads/tasks',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `task-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
