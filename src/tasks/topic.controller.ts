import {
  Controller, Post, Get, Body, Param, ParseIntPipe,
  UseInterceptors, UploadedFile, NotFoundException, UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TopicsService } from './topic.service';
import { CreateTopicDto } from './dtos/CreateTopicDTO';
import { AssignTasksToTopicDto } from './dtos/AssignTasksToTopicDto';
import { Topic } from './entities/topic.entity';
import { TopicDeadline } from './entities/topic-deadline.entity';

import { deadlineFileMulterOptions } from '../../uploads/deadline-upload';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ReqUser } from '../auth/req-user.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('topics')
export class TopicsController {
  constructor(
    private readonly topicsService: TopicsService,
    @InjectRepository(Topic) private readonly topicRepo: Repository<Topic>,
  ) {}

  // ---- Topics ----
  @Post()
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Get()
  findAll() {
    return this.topicsService.findAll();
  }

  @Get('/shared')
  getAllSharedTopics(@ReqUser() user) {
    return this.topicsService.getAllSharedTopics(user.sub);
  }

  @Get('/shared/interns/:internId')
  getAllSharedTopicsForIntern(@Param('internId', ParseIntPipe) internId: number) {
    return this.topicsService.getAllSharedTopicsForIntern(internId);
  }

  @Get('/by-intern/:internId')
  getByIntern(@Param('internId', ParseIntPipe) internId: number) {
    return this.topicsService.findByIntern(internId);
  }

  // ---- Tasks in topic / assignees ----
  @Get(':id/tasks')
  listTasksInTopic(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.listTasksInTopic(id);
  }

  @Get(':id/assignees')
  listAssigneesInTopic(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.listAssigneesInTopic(id);
  }

  // ---- Deadlines ----
  @Post(':id/deadlines')
  @UseInterceptors(FileInterceptor('file', deadlineFileMulterOptions))
  async addDeadlineToTopic(
    @Param('id', ParseIntPipe) topicId: number,
    @UploadedFile() file: any,
    @Body() body: { requirement: string; deadline: string },
  ) {
    const fileUrl = file
      ? `http://localhost:3000/uploads/deadlines/${file.filename}`
      : undefined;

    return this.topicsService.createDeadlineForTopic(topicId, {
      requirement: body.requirement,
      deadline: new Date(body.deadline),
      fileUrl,
    });
  }

  @Get(':id/deadlines')
  async getDeadlines(@Param('id', ParseIntPipe) topicId: number) {
    const topic = await this.topicRepo.findOne({
      where: { id: topicId },
      relations: ['deadlines'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic.deadlines;
  }

  @Post('deadlines/:id/submit')
  @UseInterceptors(FileInterceptor('file', deadlineFileMulterOptions))
  async submitDeadline(
    @Param('id', ParseIntPipe) deadlineId: number,
    @UploadedFile() file: any,
    @Body() body: { submissionText: string },
  ) {
    const fileUrl = file
      ? `http://localhost:3000/uploads/deadlines/${file.filename}`
      : undefined;

    return this.topicsService.submitDeadline(deadlineId, {
      submissionText: body.submissionText,
      submissionFileUrl: fileUrl,
    });
  }

  // ---- Keep this LAST to avoid shadowing others ----
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.findOne(id);
  }

  // ---- Assign tasks to a topic ----
  @Post('assign-tasks')
  assignTasks(@Body() dto: AssignTasksToTopicDto) {
    return this.topicsService.assignTasks(dto);
  }
}
