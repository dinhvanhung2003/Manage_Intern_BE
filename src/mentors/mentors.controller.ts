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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternAssignment } from '../admin/entities/user.assign.entity';
import { Topic } from '../tasks/entities/topic.entity';
import { Task } from '../tasks/entities/task.entity';
import {ParseIntPipe} from '@nestjs/common';
import { TopicsService } from '../tasks/topic.service';
import { ReqUser } from '../auth/req-user.decorators';
@UseGuards(JwtAuthGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(InternAssignment) private readonly assignmentRepo: Repository<InternAssignment>,
    @InjectRepository(Topic) private readonly topicRepo: Repository<Topic>
    ,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>
    ,
  private readonly topicsService: TopicsService
  ) { }
    // tim kiem intern
  // mentor.controller.ts
@Get('/interns')
async getMyInterns(
  @Req() req: Request,
  @Query('search') search?: string,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
) {
  const user = req.user as { sub: number };
  return this.mentorService.getInternsOfMentor(
    user.sub,
    Number(page),
    Number(limit),
    search
  );
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
  listTasksAssignedNoTopic(
    @ReqUser() user: any,
    @Query('topicId') topicId?: string
  ) {
    const id = topicId ? Number(topicId) : undefined;
    const mentorId = user?.sub; // id mentor từ JWT
    return this.topicsService.listTasksAssignedNoTopic({ topicId: id, mentorId });
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


  // phân tích ở dashboard cho mentor 
@Get('/dashboard/intern-statistics')
async getInternStats(
  @Req() req: Request,
  @Query('year') year: string,
  @Query('month') month?: string
) {
  const mentorId = (req.user as any).sub;

  const qb = this.assignmentRepo
    .createQueryBuilder('a')
    .select([
      month
        ? `TO_CHAR(a.startDate, 'YYYY-MM-DD') AS date`
        : `TO_CHAR(a.startDate, 'MM') AS month`,
    ])
    .addSelect('COUNT(*)', 'count')
    .where('a.mentorId = :mentorId', { mentorId })
    .andWhere('EXTRACT(YEAR FROM a.startDate) = :year', { year: parseInt(year) });

  if (month) {
    qb.andWhere(`TO_CHAR(a.startDate, 'MM') = :month`, { month });
    qb.groupBy(`TO_CHAR(a.startDate, 'YYYY-MM-DD')`);
    qb.orderBy(`TO_CHAR(a.startDate, 'YYYY-MM-DD')`, 'ASC');
  } else {
    qb.groupBy(`TO_CHAR(a.startDate, 'MM')`);
    qb.orderBy(`TO_CHAR(a.startDate, 'MM')`, 'ASC');
  }

  const result = await qb.getRawMany();

  return result.map(row => (month ? { date: row.date } : { month: row.month })).map((row, idx) => ({
    ...row,
    count: parseInt(result[idx].count),
  }));
}






@Get('dashboard/summary')
async getDashboardSummary(@Req() req: Request) {
  const user = req.user as { sub: number };
  return this.mentorService.getDashboardSummary(user.sub);
}
@Get('/dashboard/topic-tasks')
async getTopicTaskStats(@Req() req: Request) {
  const mentorId = (req.user as any).sub;

  const rows = await this.topicRepo
    .createQueryBuilder('topic')
    .leftJoin('topic.tasks', 'task')
    .leftJoin('topic.createdBy', 'mentor')
    .select('topic.id', 'id')
    .addSelect('topic.title', 'name')
    .addSelect('COUNT(task.id)', 'taskCount')
    .where('mentor.id = :mentorId', { mentorId })
    .groupBy('topic.id')
    .addGroupBy('topic.title')
    .getRawMany();

  return rows.map(r => ({ id: +r.id, name: r.name, value: +r.taskCount }));
}


// GET /dashboard/topics/:topicId/rank
// GET /mentor/dashboard/topics/:topicId/rank
@Get('/dashboard/topics/:topicId/rank')
async getTopicRank(
  @Param('topicId', ParseIntPipe) topicId: number,
  @Req() req: Request,
) {
  const mentorId = (req.user as any).sub;

  const rows = await this.taskRepo
    .createQueryBuilder('task')
    .leftJoin('task.topic', 'topic')
    .leftJoin('task.assignedTo', 'intern')       
    .leftJoin('topic.createdBy', 'mentor')
    .select('intern.id', 'internId')
    .addSelect('intern.name', 'internName')
    .addSelect('task.id', 'taskId')
    .addSelect('task.score', 'score')
    .where('topic.id = :topicId', { topicId })
    .andWhere('mentor.id = :mentorId', { mentorId })
    .andWhere("intern.type = 'intern'")
    .orderBy('task.score', 'DESC', 'NULLS LAST')
    .getRawMany();

  // rank theo thứ tự điểm
  return rows.map((r, idx) => ({
    rank: idx + 1,
    internId: +r.internId,
    internName: r.internName,
    taskId: +r.taskId,
    score: r.score !== null ? +r.score : null,
  }));
}





}
