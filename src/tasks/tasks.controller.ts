// task.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskImageMulterOptions } from '../configs/multer.config';

@Controller('tasks')
export class TasksController {
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', taskImageMulterOptions))
  uploadTaskImage(@UploadedFile() file: any) {
    const url = `${process.env.HOST_URL}/uploads/tasks/${file.filename}`;
    return { url };
  }
}
