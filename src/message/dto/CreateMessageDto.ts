import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  assignmentId: number;

  @IsInt()
  senderId: number;

  @IsString()
  message: string;
}
