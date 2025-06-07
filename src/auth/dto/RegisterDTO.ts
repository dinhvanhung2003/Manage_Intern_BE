import { IsEmail, IsIn, MinLength } from 'class-validator';




export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsIn(['admin', 'mentor', 'intern'])
  type: string;
}