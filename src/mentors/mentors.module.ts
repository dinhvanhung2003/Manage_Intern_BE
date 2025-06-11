import { Module } from '@nestjs/common';
import { MentorController } from './mentors.controller';
import { MentorService } from './mentors.service';
import {InternAssignment} from '../admin/entities/user.assign';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity'; 
import { User } from '../users/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([InternAssignment,Task,User]), 
  ],
  controllers: [MentorController],
  providers: [MentorService]
})
export class MentorsModule {}
