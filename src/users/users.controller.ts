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
import { User } from './entities/user.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from './entities/user.entity'
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { successResponse, errorResponse } from '../common/response';
Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles("admin")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly http: HttpService,
  ) { }
 // Message quene
  @Post('seed-users')
  seedUsers() {
    return this.usersService.seedUsers();
  }
   @Get()
  async getAllUsers() {
    try {
      const users = await this.usersService.findAll();
      return successResponse(users, "Lấy danh sách người dùng thành công!");
    } catch (err) {
      return errorResponse(err.message || err, "Lấy danh sách người dùng thất bại!");
    }
  }
  // @Get('/interns')
  // @Roles("mentor", "admin")
  // getInterns(): Promise<User[]> {
  //   return this.usersService.findByType(UserRole.INTERN);
  // }
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
