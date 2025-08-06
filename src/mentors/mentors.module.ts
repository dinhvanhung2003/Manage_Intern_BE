import { Module } from '@nestjs/common';
import { MentorController } from './mentors.controller';
import { MentorService } from './mentors.service';
import {InternAssignment} from '../admin/entities/user.assign.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity'; 
import { User } from '../users/entities/user.entity';
import { TaskGateway } from '../mentors/task.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([InternAssignment,Task,User]),  NotificationsModule,TasksModule
  ],
  controllers: [MentorController],
  providers: [MentorService,TaskGateway]
})
export class MentorsModule {}
