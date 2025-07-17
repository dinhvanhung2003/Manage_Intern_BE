
import { diskStorage } from 'multer';
import { extname } from 'path';

export const deadlineFileMulterOptions = {
  storage: diskStorage({
    destination: './uploads/deadlines', 
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `deadline-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
};
