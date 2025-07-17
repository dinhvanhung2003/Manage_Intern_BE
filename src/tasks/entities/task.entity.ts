import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';
import { TaskImage } from './task.image';
import { OneToMany } from 'typeorm';
import { DeleteDateColumn } from 'typeorm/decorator/columns/DeleteDateColumn';
import { BaseSoftDeleteEntity } from '../../common/entities/base-soft-delete.entity';
import { TaskStatusLog } from './task.log';
import { Topic } from './topic.entity';
export enum TaskStatus {
  ASSIGNED = 'assigned',        // Mới khởi tạo (chưa nhận)
  IN_PROGRESS = 'in_progress',  // Đang xử lý
  COMPLETED = 'completed',      // Đã hoàn thành (đã submit)
  ERROR = 'error',              // Lỗi (do mentor đánh giá)
}


@Entity()
export class Task extends BaseSoftDeleteEntity {
  // @PrimaryGeneratedColumn()
  // id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ASSIGNED })
  status: TaskStatus;

  @ManyToOne(() => User)
  assignedTo: User | null;

  @ManyToOne(() => User)
  assignedBy: User;

  @Column({ type: 'date' })
  dueDate: Date;
  @OneToMany(() => TaskImage, (image) => image.task, { cascade: true })
  images: TaskImage[];
  // @DeleteDateColumn({ nullable: true })
  // deletedAt?: Date;

  @Column({ type: 'text', nullable: true })
submittedText?: string;

@Column({ nullable: true })
submittedFile?: string;
@OneToMany(() => TaskStatusLog, log => log.task)
statusLogs: TaskStatusLog[];
@ManyToOne(() => Topic, (topic) => topic.tasks)
topic: Topic;
}
