import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { CreateTopicDto } from './dtos/CreateTopicDTO';
import { User } from '../users/user.entity';
import { NotFoundException } from '@nestjs/common';
import { AssignTasksToTopicDto } from './dtos/AssignTasksToTopicDto';
import { Task } from './entities/task.entity';
import { TopicDeadline } from './entities/topic-deadline';
import { TaskGateway } from '../mentors/task.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { TopicGateway } from './topic.gateway';
@Injectable()
export class TopicsService {
    constructor(
        @InjectRepository(Topic)
        private topicRepo: Repository<Topic>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Task)
        private taskRepo: Repository<Task>,
        @InjectRepository(TopicDeadline)
        private deadlineRepo: Repository<TopicDeadline>,
         private readonly topicGateway: TopicGateway,
        private readonly notificationsService: NotificationsService,
    ) { }

   async create(dto: CreateTopicDto): Promise<Topic> {
  const createdBy = await this.userRepo.findOneBy({ id: dto.createdById });
  if (!createdBy) throw new Error('Mentor not found');

  const assignedTo = dto.assignedToId
    ? await this.userRepo.findOneBy({ id: dto.assignedToId })
    : undefined;

  const topicData: Partial<Topic> = {
    title: dto.title,
    description: dto.description,
    dueDate: dto.dueDate,
    createdBy,
    ...(assignedTo && { assignedTo }),
  };

  const topic = this.topicRepo.create(topicData);
  return await this.topicRepo.save(topic); 
}




    async findAll(): Promise<Topic[]> {
        return this.topicRepo.find({
            relations: ['createdBy', 'assignedTo', 'tasks'],
            order: { id: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Topic> {
  const topic = await this.topicRepo.findOne({
    where: { id },
    relations: ['createdBy', 'assignedTo', 'tasks'],
  });

  if (!topic) {
    throw new NotFoundException(`Topic with id ${id} not found`);
  }

  return topic;
}
async findByIntern(internId: number): Promise<Topic[]> {
  return this.topicRepo.find({
    where: { assignedTo: { id: internId } },
    relations: ['assignedTo', 'createdBy'],
  });
}
async assignTasks(dto: AssignTasksToTopicDto): Promise<void> {
  const { topicId, taskIds } = dto;

  const topic = await this.topicRepo.findOne({ where: { id: topicId } });
  if (!topic) throw new NotFoundException('Topic not found');

  await this.taskRepo
    .createQueryBuilder()
    .update()
    .set({ topic })
    .whereInIds(taskIds)
    .execute();
}
async createDeadlineForTopic(topicId: number, dto: {
  requirement: string;
  deadline: Date;
  fileUrl?: string;
}): Promise<TopicDeadline> {
  const topic = await this.topicRepo.findOne({
    where: { id: topicId },
    relations: ['assignedTo'], // Đảm bảo lấy được intern của topic
  });
  if (!topic) throw new Error('Topic not found');

  const deadline = this.deadlineRepo.create({
    ...dto,
    topic,
  });

  const savedDeadline = await this.deadlineRepo.save(deadline);

  // ===== THÔNG BÁO =====
  const intern = topic.assignedTo;
  if (intern) {
    const message = `Bạn vừa được giao deadline mới trong topic "${topic.title}"`;

    // Gửi socket real-time nếu online
   await this.topicGateway.sendDeadlineAssigned(intern.id, {
  id: savedDeadline.id,
  requirement: dto.requirement,
  deadline: dto.deadline,
  topicId: topic.id,
  topicTitle: topic.title,
});


    // Lưu thông báo trong DB
    await this.notificationsService.create(intern.id, message);

    // Gửi push notification nếu có đăng ký
    const subs = await this.notificationsService.getSubscriptionsByUser(intern.id);
    if (subs.length > 0) {
      await this.notificationsService.sendPushNotification(subs[0].subscription, {
        title: 'Deadline mới',
        body: message,
      });
    }
  }

  return savedDeadline;
}


  async submitDeadline(deadlineId: number, data: {
  submissionText: string;
  submissionFileUrl?: string;
}): Promise<TopicDeadline> {
  const deadline = await this.deadlineRepo.findOne({ where: { id: deadlineId } });
  if (!deadline) throw new NotFoundException('Deadline not found');

  deadline.submissionText = data.submissionText;
  deadline.submissionFileUrl = data.submissionFileUrl;
  deadline.submittedAt = new Date();

  return this.deadlineRepo.save(deadline);
}

}
