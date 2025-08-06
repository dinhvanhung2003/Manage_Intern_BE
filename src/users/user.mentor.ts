import { ChildEntity, Column } from 'typeorm';
import { User } from './entities/user.entity';

@ChildEntity('mentor')
export class Mentor extends User {
  @Column({ nullable: true })
  expertise?: string;
}
