import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('intern_assignments')
export class InternAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'internId' }) 
  intern: User;

  @Column() 
  internId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

  @Column() 
  mentorId: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;
}
