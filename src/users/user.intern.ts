import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('intern')
export class Intern extends User {
  @Column({ nullable: true })
  school?: string;

  @Column({ nullable: true })
  major?: string;

  @Column({ nullable: true })
  studentId?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  dob?: Date;

  @Column({ nullable: true })
  githubLink?: string;

  @Column({ nullable: true })
  linkedinLink?: string;
}

