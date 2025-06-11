import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MentorService } from './mentors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Post, Body } from '@nestjs/common';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Param } from '@nestjs/common';
import { Patch } from '@nestjs/common';
// @UseGuards(JwtAuthGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('interns')
  async getMyInterns(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.mentorService.getInternsOfMentor(user.sub);
  }
   @Post('tasks')
  async assignTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const user = req.user as { sub: number };
    return this.mentorService.assignTask(user.sub, dto);
  }
  @Get('interns/:id/tasks')
async getTasksByIntern(@Param('id') id: number, @Req() req: Request) {
  const mentor = req.user as { sub: number };
  return this.mentorService.getTasksOfIntern(mentor.sub, +id);
}
 @Patch('tasks/:id/complete')
async completeTask(@Param('id') id: number, @Req() req: Request) {
  const mentorId = (req.user as any).sub;
  return this.mentorService.markCompleted(id, mentorId);
}

// message queue
@Post('seed-tasks')
seedTasks() {
  return this.mentorService.seedTasks();
}
}
