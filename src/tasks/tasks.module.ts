import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image';
import { TaskService } from './tasks.service'; 
import { TaskStatusLog } from './entities/task.log';

import { TaskStatusLogService } from './task-status-log.service';
import { TaskStatusLogController } from './task-status-log.controller';
import {Topic} from './entities/topic.entity'; 
import { TopicsController } from './topic.controller';
import { TopicsService } from './topic.service';
import { User } from '../users/user.entity';
import {TopicDeadline} from './entities/topic-deadline';
import { TopicGateway } from './topic.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskImage, TaskStatusLog,Topic,User,TopicDeadline]), 
    NotificationsModule,
    
  ],
  controllers: [
    TasksController,
    TaskStatusLogController, 
    TopicsController
  ],
  providers: [
    TaskService,
    TaskStatusLogService, 
    TopicsService,
    TopicGateway
  ],
  exports: [TypeOrmModule,TaskStatusLogService],

})

export class TasksModule {}


