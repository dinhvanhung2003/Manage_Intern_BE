import { TaskStatus } from '../entities/task.entity';
export class UpdateTaskStatusDto {
  status: TaskStatus;
  note?: string;
}