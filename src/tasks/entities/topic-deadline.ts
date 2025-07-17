import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Topic } from './topic.entity';

@Entity()
export class TopicDeadline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  requirement: string;

  @Column({ type: 'timestamp' })
  deadline: Date;

  // File yêu cầu từ mentor
  @Column({ type: 'text', nullable: true })
  fileUrl?: string;

  @ManyToOne(() => Topic, (topic) => topic.deadlines, { onDelete: 'CASCADE' })
  topic: Topic;

  // ======= Phần nộp bài của intern =======
  
  // Text nộp bài của intern
  @Column({ type: 'text', nullable: true })
  submissionText?: string;

  // File đính kèm do intern nộp
  @Column({ type: 'text', nullable: true })
  submissionFileUrl?: string;

  // Ngày giờ nộp bài
  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;
}
