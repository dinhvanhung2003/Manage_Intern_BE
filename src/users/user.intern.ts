import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('intern')
export class Intern extends User {
  @Column({ nullable: true })
  school?: string;
}
