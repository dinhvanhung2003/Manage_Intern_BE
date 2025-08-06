import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Document } from './document.entity';
import { DocumentType } from './constants/document-type';

@Entity()
export class DocumentFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    enumName: 'document_file_type_enum',
  })
  type: DocumentType;

  @Column()
  fileUrl: string;

  @ManyToOne(() => Document, (document) => document.files, { onDelete: 'CASCADE' })
  document: Document;
}
