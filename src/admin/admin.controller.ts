import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAssignmentDto } from './dto/CreateAssignmentDto';
import { Body, Post, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Repository } from 'typeorm';
import { Query } from '@nestjs/common';
@Roles('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) { }

  @Get('users')
  @Roles('admin')
  getAllUsers() {
    return this.adminService.findAllInternsAndMentors();
  }
  @Post('assignments')
  assign(@Body() dto: CreateAssignmentDto) {
    return this.adminService.assignIntern(dto);
  }

  @Get('assignments')
  findAll() {
    return this.adminService.findAllAssignments();
  }

  @Delete('assignments/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeAssignment(id);
  }

  // message queue
  @Post('assign-random')
  assignAll() {
    return this.adminService.enqueueRandomAssignments();
  }
  // lấy tất cả các task 
  @Get('tasks')
async getAllTasks(@Query('keyword') keyword?: string) {
  return this.adminService.searchAllTasks(keyword);
}


}
