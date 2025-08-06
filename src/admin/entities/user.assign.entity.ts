import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('intern_assignments')
export class InternAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  internId: number;

  @Column()
  mentorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'internId' })
  intern: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @OneToMany(() => Message, (message) => message.assignment)
  messages: Message[];
}
