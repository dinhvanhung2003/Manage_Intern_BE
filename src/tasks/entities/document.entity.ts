import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  JoinTable,
  ManyToMany,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Topic } from '../entities/topic.entity';
import { Task } from '../entities/task.entity';
import { DocumentFile } from './document-file';
import { DocumentType } from './constants/document-type';
import { DocumentStatus } from './constants/document-status';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    enumName: 'document_type_enum',
  })
  type: DocumentType;

  @ManyToOne(() => User, (user) => user.uploadedDocuments, { eager: false })
  uploadedBy: User;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    enumName: 'document_status_enum',
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @ManyToOne(() => User, { nullable: true })
  approvedBy: User | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @OneToMany(() => DocumentFile, (file) => file.document, 
    { cascade: true }
)
  files: DocumentFile[];

  @ManyToMany(() => Topic)
  @JoinTable()
  sharedWithTopics: Topic[];

   @ManyToMany(() => Task, (task) => task.sharedDocuments)
  sharedWithTasks: Task[];
  

  

}