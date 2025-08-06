import { Module } from '@nestjs/common';
import { InternsController } from '@interns/controllers/interns.controller';
import { InternsService } from './interns.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intern } from '../users/user.intern';
import { HttpModule } from '@nestjs/axios';
import {Task} from '../tasks/entities/task.entity'; 
import {InternAssignment} from '../admin/entities/user.assign.entity';
import { TasksModule } from '../tasks/tasks.module';
@Module({
   imports: [TypeOrmModule.forFeature([Intern,Task,InternAssignment]),HttpModule,TasksModule], 
  controllers: [InternsController],
  providers: [InternsService]
})
export class InternsModule {}
