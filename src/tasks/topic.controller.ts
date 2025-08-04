import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TopicsService } from './topic.service';
import { CreateTopicDto } from './dtos/CreateTopicDTO';
import { Topic } from './entities/topic.entity';
import { AssignTasksToTopicDto } from './dtos/AssignTasksToTopicDto';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NotFoundException } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicDeadline } from './entities/topic-deadline';
import { deadlineFileMulterOptions } from '../../uploads/deadline-upload';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { ReqUser } from '../auth/req-user.decorators';
import { User } from '../users/user.entity';
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService,

     @InjectRepository(Topic)
            private topicRepo: Repository<Topic>,
  ) {}

  @Post()
  create(@Body() dto: CreateTopicDto): Promise<Topic> {
    return this.topicsService.create(dto);
  }

  @Get()
  findAll(): Promise<Topic[]> {
    return this.topicsService.findAll();
  }
@Get('/shared')
getAllSharedTopics(@ReqUser() user): Promise<Topic[]> {
  return this.topicsService.getAllSharedTopics(user.sub);
}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Topic> {
    return this.topicsService.findOne(id);
  }
  @Get('/by-intern/:internId')
getByIntern(@Param('internId', ParseIntPipe) internId: number): Promise<Topic[]> {
  return this.topicsService.findByIntern(internId);
}
@Post('assign-tasks')
assignTasks(@Body() dto: AssignTasksToTopicDto) {
  return this.topicsService.assignTasks(dto);
}

// @Post(':id/deadlines')
// @UseInterceptors(FileInterceptor('file'))
// async addDeadlineToTopic(
//   @Param('id', ParseIntPipe) topicId: number,
//   @UploadedFile() file: any,
//   @Body() body: { requirement: string; deadline: string }
// ) {
//   const fileUrl = file ? `uploads/${file.filename}` : undefined;

//   return this.topicsService.createDeadlineForTopic(topicId, {
//     requirement: body.requirement,
//     deadline: new Date(body.deadline),
//     fileUrl,
//   });
// }
@Post(':id/deadlines')
@UseInterceptors(FileInterceptor('file', deadlineFileMulterOptions))

async addDeadlineToTopic(
  @Param('id', ParseIntPipe) topicId: number,
  @UploadedFile() file: any,
  @Body() body: { requirement: string; deadline: string }
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
  @Body() body: { submissionText: string }
) {
  const fileUrl = file ? `uploads/deadlines/${file.filename}` : undefined;
  return this.topicsService.submitDeadline(deadlineId, {
    submissionText: body.submissionText,
    submissionFileUrl: fileUrl,
  });
}


}
