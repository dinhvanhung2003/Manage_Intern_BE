import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAssignmentDto } from './dto/CreateAssignmentDto';
import { Body, Post, Delete, Param, ParseIntPipe } from '@nestjs/common';
@Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

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
}
