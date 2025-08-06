// src/task-status-log/task-status-log.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TaskStatusLogService } from '@tasks/services/task-status-log.service';

@Controller('task-logs')
export class TaskStatusLogController {
  constructor(private readonly logService: TaskStatusLogService) {}

  // GET /task-logs/:taskId
  @Get(':taskId')
  async getLogs(@Param('taskId', ParseIntPipe) taskId: number) {
    const logs = await this.logService.getLogsByTask(taskId);
    return { data: logs };
  }
  
}
