// topic.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne,ManyToMany } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/user.entity';
import { TopicDeadline } from './topic-deadline';
import { Document } from '../../tasks/entities/document.entity';
@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @ManyToOne(() => User) // Người tạo (mentor)
  createdBy: User;

  @ManyToOne(() => User, { nullable: true }) // Người được giao (intern)
  assignedTo: User;

  @OneToMany(() => Task, (task) => task.topic)
  tasks: Task[];
  // topic.entity.ts
@OneToMany(() => TopicDeadline, (deadline) => deadline.topic)
deadlines: TopicDeadline[];
@ManyToMany(() => Document, (doc) => doc.sharedWithTopics)
documents: Document[];

}
