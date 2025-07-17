import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsNumber()
  createdById: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;
}
