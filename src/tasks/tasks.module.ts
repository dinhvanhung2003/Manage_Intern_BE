import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controllers/tasks.controller';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image.entity';
import { TaskService } from '@tasks/services/tasks.service'; 
import { TaskStatusLog } from './entities/task.log.enity';

import { TaskStatusLogService } from '@tasks/services/task-status-log.service';
import { TaskStatusLogController } from './task-status-log.controller';
import {Topic} from './entities/topic.entity'; 
import { TopicsController } from './topic.controller';
import { TopicsService } from './topic.service';
import { User } from '../users/entities/user.entity';
import {TopicDeadline} from './entities/topic-deadline.entity';
import { TopicGateway } from './topic.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { MulterModule } from '@nestjs/platform-express';
import {Document} from './entities/document.entity';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { DocumentFile } from './entities/document-file.entity';
import { join } from 'path';
@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskImage, TaskStatusLog,Topic,User,TopicDeadline,Document,DocumentFile]), 
    NotificationsModule,
    
  ],
  controllers: [
    TasksController,
    TaskStatusLogController, 
    TopicsController,
    DocumentsController
  ],
  providers: [
    TaskService,
    TaskStatusLogService, 
    TopicsService,
    TopicGateway,
    DocumentsService
  ],
  exports: [TypeOrmModule,TaskStatusLogService],

})

export class TasksModule {}


