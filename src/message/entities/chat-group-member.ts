import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ChatGroup } from './chat-group.entity';

@Entity()
export class ChatGroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChatGroup, (group) => group.members, { onDelete: 'CASCADE' })
  group: ChatGroup;

  @Column()
  userId: number;

  @Column()
  userType: 'mentor' | 'intern';
}
