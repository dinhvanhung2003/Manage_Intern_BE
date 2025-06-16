import { Module } from '@nestjs/common';
import { MentorController } from './mentors.controller';
import { MentorService } from './mentors.service';
import {InternAssignment} from '../admin/entities/user.assign';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity'; 
import { User } from '../users/user.entity';
import { TaskGateway } from '../mentors/task.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([InternAssignment,Task,User]),  NotificationsModule
  ],
  controllers: [MentorController],
  providers: [MentorService,TaskGateway]
})
export class MentorsModule {}
