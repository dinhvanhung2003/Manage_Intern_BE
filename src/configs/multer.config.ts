import { diskStorage } from 'multer';
import { extname } from 'path';

export const avatarMulterOptions = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => {
      const user = req.user as { sub: number };
      const ext = extname(file.originalname); 
      const fileName = `avatar-${user.sub}${ext}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, 
  },
};
