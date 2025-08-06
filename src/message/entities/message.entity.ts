// src/chat/entities/message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { InternAssignment } from '../../admin/entities/user.assign.entity'
import { ChatGroup } from './chat-group.entity';
@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InternAssignment, (assignment) => assignment.messages, { onDelete: 'CASCADE' })
  assignment: InternAssignment;

  @ManyToOne(() => ChatGroup, { nullable: true, onDelete: 'CASCADE' })
  group: ChatGroup;
  @Column()
  senderId: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  sentAt: Date;
}
