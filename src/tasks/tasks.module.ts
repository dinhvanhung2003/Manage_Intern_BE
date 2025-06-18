import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image';
import { TasksService } from './tasks.service'; 

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskImage])],
  controllers: [TasksController],
  providers: [TasksService], 
  exports: [TypeOrmModule],
})
export class TasksModule {}
