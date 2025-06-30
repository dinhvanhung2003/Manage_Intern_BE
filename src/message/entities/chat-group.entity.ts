import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/user.entity'; 

@Entity()
export class ChatGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Message, (message) => message.group)
  messages: Message[];

  @ManyToMany(() => User, { eager: true }) 
@JoinTable()
members: User[];
}
