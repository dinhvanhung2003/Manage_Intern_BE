import { IsInt, IsDateString, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class CreateAssignmentDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  internIds: number[];

  @IsInt()
  mentorId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
