import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  TableInheritance,
  ManyToMany,
} from 'typeorm';
import { TaskStatusLog } from '../tasks/entities/task.log';
import { BaseSoftDeleteEntity } from '../common/entities/base-soft-delete.entity';
import { ChatGroup } from '../message/entities/chat-group.entity';
import { Document } from '../tasks/entities/document.entity';
export enum UserRole {
  ADMIN = 'admin',
  INTERN = 'intern',
  MENTOR = 'mentor',
}

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User extends BaseSoftDeleteEntity {
  // @PrimaryGeneratedColumn()
  // id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
  @Column({ name:'type'})
  type:string;
// @Column({name:'type'})
// type: string;
  // @Column({ type: 'enum', enum: UserRole, default: UserRole.INTERN })
  // role: UserRole;
// type: string;
  @Column({ nullable: true })
  bio: string;

 @Column({ type: 'text', nullable: true })
refreshToken?: string | null;

// type?: string;
  // quan hệ mentor và intern

  // intern → mentor
  @ManyToOne(() => User, (user) => user.interns, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'mentorId' })
  mentor: User;


  @Column({ nullable: true })
  mentorId: number;

  // mentor → interns
  @OneToMany(() => User, (user) => user.mentor)
  interns: User[];
  @OneToMany(() => TaskStatusLog, log => log.user)
statusLogs: TaskStatusLog[];
@ManyToMany(() => ChatGroup, group => group.members)
groups: ChatGroup[];
@OneToMany(() => Document, (doc) => doc.uploadedBy)
uploadedDocuments: Document[];


}
