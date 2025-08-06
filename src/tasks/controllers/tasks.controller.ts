import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskImageMulterOptions } from '../../configs/multer.config';
import { Task } from '../entities/task.entity';
import { BaseSoftDeleteController } from '../../common/controllers/base-soft-delete';
import { TaskService } from '@tasks/services/tasks.service';
import { Get, Query } from '@nestjs/common';
import { Patch, Param } from '@nestjs/common';
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

  @Get()
  async getFilteredTasks(
    @Query('school') school?: string,
    @Query('status') status?: string,
    @Query('title') title?: string,
    @Query('mentorId') mentorId?: number,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
  ): Promise<Task[]> {
    return this.taskService.filterTasks({ school, status, title, mentorId, dueDateFrom, dueDateTo });
  }

@Patch(':id/score')
async gradeTask(
  @Param('id') id: number,
  @Body('score') score: number
): Promise<Task> {
  return this.taskService.gradeTask(id, score);
}

}
