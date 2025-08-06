import { ChildEntity, Column } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('admin')
export class Admin extends User {
  @Column({ nullable: true })
  department?: string;
}
