import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MentorService } from './mentors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Post, Body } from '@nestjs/common';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Param } from '@nestjs/common';
import { Patch } from '@nestjs/common';
import { Delete,Query } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { Roles } from '../auth/roles.decorator';
import { HttpCode } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { TaskStatus } from '../tasks/entities/task.entity';
import { UpdateTaskStatusDto } from '../tasks/dtos/UpdateTaskStatusDTO';
@UseGuards(JwtAuthGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService,
    private readonly notificationsService: NotificationsService) { }
    // tim kiem intern
  @Get('interns')
async getMyInterns(
  @Req() req: Request,
  @Query('search') search?: string,
) {

  const user = req.user as { sub: number };
  return this.mentorService.getInternsOfMentor(user.sub, search);
}
@Patch('tasks/:id/status')
async mentorUpdateTaskStatus(
  @Param('id') id: number,
  @Body() body: UpdateTaskStatusDto, 
  @Req() req: Request,
) {
  const mentorId = (req.user as any).sub;
  return this.mentorService.updateTaskStatusByMentor(+id, mentorId, body.status, body.note); 
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
async getAllMyTasks(
  @Req() req: Request,
  @Query('title') title?: string,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
   @Query('unassignedOnly') unassignedOnly = 'false',
) {
  const mentorId = (req.user as any).sub;
  return this.mentorService.getAllTasksCreatedByMentor(
    mentorId,
    title,
    parseInt(page),
    parseInt(limit),
     unassignedOnly === 'true',
  );
}
// danh sách task để gán cho topic
@Get('tasks/assigned-no-topic')
async getAssignedTasksWithoutTopic(@Req() req: Request) {
  const mentorId = (req.user as any).sub;
  return this.mentorService.getTasksAssignedWithoutTopic(mentorId);
}


  @HttpCode(204)
  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: number, @Req() req: Request) {
    await this.mentorService.deleteTask(+id, (req.user as any).sub);
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: number, @Req() req: Request, @Body() dto: Partial<CreateTaskDto>) {
    return this.mentorService.updateTask(+id, (req.user as any).sub, dto);
  }

  @Post('tasks/reuse')
  assignFromExisting(@Body() body: { taskId: number; internId: number }) {
    return this.mentorService.reassignTask(body.taskId, body.internId);
  }
  // @Roles('intern')
  // @Post('save-subscription')
  // @UseGuards(JwtAuthGuard)
  // async savePushSubscription(@Req() req: Request, @Body() subscription: any) {
  //   const user = req.user as { sub: number };
  //   return this.notificationsService.saveSubscription(user.sub, subscription);
  // }
  // khoi phuc task theo id
  @Patch('tasks/:id/restore')
  async restoreTask(@Param('id') taskId: number, @Req() req: Request) {
    const mentorId = (req.user as any).sub;
    return this.mentorService.restoreTask(+taskId, mentorId);
  }
  // lay cac task bi xoa 
  @Get('tasks/deleted')
  async getDeletedTasks(@Req() req: Request) {
    const mentorId = (req.user as any).sub;
    return this.mentorService.getDeletedTasks(mentorId);
  }


  // phan cong khi da co task roi 
  @Patch('tasks/:id/assign')
  async assignTaskToIntern(
    @Param('id') taskId: number,
    @Req() req: Request,
    @Body() body: { internId: number },
  ) {
    const mentorId = (req.user as any).sub;
    return this.mentorService.assignTaskToIntern(taskId, body.internId, mentorId);
  }

}
