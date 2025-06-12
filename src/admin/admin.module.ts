import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { InternAssignment } from './entities/user.assign';
import { Task } from '../tasks/entities/task.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User,InternAssignment,Task])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

