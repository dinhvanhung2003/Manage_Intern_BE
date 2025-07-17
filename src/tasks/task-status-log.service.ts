// src/task-status-log/task-status-log.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskStatusLog } from './entities/task.log'
import { Repository } from 'typeorm';
const STATUS_LABELS: Record<string, string> = {
  assigned: 'Chưa nhận',
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  error: 'Lỗi',
};

@Injectable()
export class TaskStatusLogService {
  constructor(
    @InjectRepository(TaskStatusLog)
    private readonly logRepo: Repository<TaskStatusLog>,
  ) {}

  async createLog(params: {
    taskId: number;
    userId: number;
    fromStatus: string;
    toStatus: string;
    message?: string;
    fileUrl?: string;
    note?: string; 
  }) {
    const log = this.logRepo.create({
      task: { id: params.taskId },  
      user: { id: params.userId },
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      message: params.message,
       note: params.note, 
      fileUrl: params.fileUrl,
    });

    return this.logRepo.save(log);
  }
   async getLogsByTask(taskId: number) {
  return this.logRepo.find({
    where: { task: { id: taskId } },
    order: { createdAt: 'ASC' },
  });
}

}

