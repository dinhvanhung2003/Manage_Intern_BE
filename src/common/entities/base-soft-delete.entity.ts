import { PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

export abstract class BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
