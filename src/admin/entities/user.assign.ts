import { ChildEntity} from 'typeorm';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('intern_assignments')
export class InternAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  intern: User;

  @ManyToOne(() => User, { eager: true })
  mentor: User;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;
}