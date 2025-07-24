import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../entities/constants/document-type';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;
}
