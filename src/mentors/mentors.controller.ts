import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MentorService } from './mentors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Post, Body } from '@nestjs/common';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Param } from '@nestjs/common';
import { Patch } from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { Roles } from '../auth/roles.decorator';
@UseGuards(JwtAuthGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService,
    private readonly notificationsService: NotificationsService) { }

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
  @Get('assignment')
  async getMyAssignment(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.mentorService.getAssignmentByMentor(user.sub);
  }
  // message queue
  @Post('seed-tasks')
  seedTasks() {
    return this.mentorService.seedTasks();
  }

  @Get('assignments')
  async getAllAssignments(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.mentorService.getAssignmentsByMentor(user.sub);
  }
  //quan ly task 
  @Get('tasks')
  async getAllMyTasks(@Req() req: Request) {
    return this.mentorService.getAllTasksCreatedByMentor((req.user as any).sub);
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: number, @Req() req: Request) {
    return this.mentorService.deleteTask(+id, (req.user as any).sub);
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: number, @Req() req: Request, @Body() dto: Partial<CreateTaskDto>) {
    return this.mentorService.updateTask(+id, (req.user as any).sub, dto);
  }

  @Post('tasks/reuse')
  assignFromExisting(@Body() body: { taskId: number; internId: number }) {
    return this.mentorService.reassignTask(body.taskId, body.internId);
  }
  @Roles('intern')
  @Post('save-subscription')
  @UseGuards(JwtAuthGuard)
  async savePushSubscription(@Req() req: Request, @Body() subscription: any) {
    const user = req.user as { sub: number };
    return this.notificationsService.saveSubscription(user.sub, subscription);
  }
}
