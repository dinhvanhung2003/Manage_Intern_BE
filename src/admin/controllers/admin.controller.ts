import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateAssignmentDto } from '../dto/CreateAssignmentDto';
import { Body, Post, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../../tasks/entities/task.entity';
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
getAllUsers(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('type') type: string,
  @Query('search') search: string = '',
) {
  return this.adminService.findAllInternsAndMentors({ page, limit, type, search });
}
  @Post('assignments')
  assign(@Body() dto: CreateAssignmentDto) {
    return this.adminService.assignIntern(dto);
  }

 @Get('assignments')
searchAssignments(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string,
) {
  return this.adminService.searchAssignments({ page, limit, search });
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
async getAllTasks(
  @Query('keyword') keyword?: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
) {
  return this.adminService.searchAllTasks(keyword, page, limit);
}

  // lay intern chua duoc phan cong 
  @Get('interns/unassigned')
async getUnassignedInterns() {
  return this.adminService.findUnassignedInterns();
}

}
