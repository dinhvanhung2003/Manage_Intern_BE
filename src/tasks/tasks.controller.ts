import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskImageMulterOptions } from '../configs/multer.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { TaskImage } from '../tasks/entities/task.image';

@Controller('tasks')
export class TasksController {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(TaskImage)
    private readonly imageRepo: Repository<TaskImage>,
  ) { }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', taskImageMulterOptions))
  async uploadTaskImage(
    @UploadedFile() file: any,
    @Body('taskId') taskId?: number,
  ) {
    const url = `${process.env.HOST_URL}/uploads/tasks/${file.filename}`;

    let image: TaskImage;

    if (taskId) {
      const task = await this.taskRepo.findOneBy({ id: +taskId });
      if (!task) throw new BadRequestException('Task không tồn tại');
      image = this.imageRepo.create({ task, url });
    } else {
     
      image = this.imageRepo.create({ url });
    }

    await this.imageRepo.save(image);
    return { url, imageId: image.id }; 
  }

}
