import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image';
import { TaskService } from './tasks.service'; 

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskImage])],
  controllers: [TasksController],
  providers: [TaskService], 
  exports: [TypeOrmModule],
})
export class TasksModule {}
