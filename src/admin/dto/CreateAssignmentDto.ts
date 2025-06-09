import { IsInt, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt()
  internId: number;

  @IsInt()
  mentorId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
