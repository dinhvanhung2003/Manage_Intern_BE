// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from './user.entity'
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// @Roles(UserRole.MENTOR)
export class UsersController {
  constructor(
  private readonly usersService: UsersService,
  private readonly http: HttpService, 
) {}
  
  @Get()
  getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }
 @Get('/interns')
  @Roles("mentor","admin") 
  getInterns(): Promise<User[]> {
    return this.usersService.findByType(UserRole.INTERN);
  }
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  createUser(@Body() body: Partial<User>): Promise<User> {
    return this.usersService.create(body);
  }

  @Put(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<User>): Promise<User> {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }




}
