import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  TableInheritance,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  INTERN = 'intern',
  MENTOR = 'mentor',
}

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ nullable: true })
  refreshToken?: string;
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
}
