import { PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
export abstract class BaseSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
createdAt: Date;
}
