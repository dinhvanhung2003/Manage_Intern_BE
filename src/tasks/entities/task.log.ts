// src/task-status-log/task-status-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../../users/user.entity';

@Entity('task_status_logs')
export class TaskStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, task => task.statusLogs, { onDelete: 'CASCADE' })
  task: Task;

  @ManyToOne(() => User, user => user.statusLogs, { eager: true })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  fromStatus: string;

  @Column({ type: 'varchar', length: 50 })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileUrl: string;

  @CreateDateColumn()
  createdAt: Date;
  @Column({ type: 'text', nullable: true })
  note?: string;
}
