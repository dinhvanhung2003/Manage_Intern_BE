import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  INTERN = 'intern',
  MENTOR = 'mentor',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  name: string;
  @Column({ unique: true })
  email: string;
  @Column()
  password: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.INTERN })
  role: UserRole;
  @Column({ nullable: true })
  bio: string;
  @Column({ nullable: true })
  refreshToken?: string;
}
