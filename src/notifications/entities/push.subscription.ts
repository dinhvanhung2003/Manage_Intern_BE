import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';


@Entity()
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('json')
  subscription: any;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
