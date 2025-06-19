import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';
import { TaskImage } from './task.image';
import { OneToMany } from 'typeorm';
import { DeleteDateColumn } from 'typeorm/decorator/columns/DeleteDateColumn';

export enum TaskStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

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
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
