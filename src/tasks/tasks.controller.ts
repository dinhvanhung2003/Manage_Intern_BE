import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskImageMulterOptions } from '../configs/multer.config';
import { Task } from '../tasks/entities/task.entity';
import { BaseSoftDeleteController } from '../common/controllers/base-soft-delete';
import { TaskService } from './tasks.service';

@Controller('tasks')
export class TasksController extends BaseSoftDeleteController<Task> {
  constructor(private readonly taskService: TaskService) {
    super(taskService); 
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', taskImageMulterOptions))
  async uploadTaskImage(
    @UploadedFile() file: any,
    @Body('taskId') taskId?: number,
  ) {
    const url = `${process.env.HOST_URL}/uploads/tasks/${file.filename}`;
    const image = await this.taskService.uploadImage(taskId, url);
    return { url, imageId: image.id };
  }
}
