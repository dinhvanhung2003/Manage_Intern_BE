import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image';
import { TaskService } from './tasks.service'; 
import { TaskStatusLog } from './entities/task.log';

import { TaskStatusLogService } from './task-status-log.service';
import { TaskStatusLogController } from './task-status-log.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskImage, TaskStatusLog]), 
  ],
  controllers: [
    TasksController,
    TaskStatusLogController, 
  ],
  providers: [
    TaskService,
    TaskStatusLogService, 
  ],
  exports: [TypeOrmModule,TaskStatusLogService],

})
export class TasksModule {}


