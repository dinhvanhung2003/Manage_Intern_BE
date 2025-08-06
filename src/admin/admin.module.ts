import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { InternAssignment } from './entities/user.assign.entity';
import { Task } from '../tasks/entities/task.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User,InternAssignment,Task])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

