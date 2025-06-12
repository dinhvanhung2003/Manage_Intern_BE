// src/chat/entities/message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import {InternAssignment} from '../../admin/entities/user.assign'

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InternAssignment, (assignment) => assignment.messages, { onDelete: 'CASCADE' })
  assignment: InternAssignment;

  @Column()
  senderId: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  sentAt: Date;
}
