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
import { IsNull } from 'typeorm';
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

 let assignedTo: User | null = null;

  if (dto.assignedToId) {
    assignedTo = await this.userRepo.findOneBy({ id: dto.assignedToId });
    if (!assignedTo) throw new Error('Intern not found');
  }

 const topic = this.topicRepo.create({
  title: dto.title,
  description: dto.description,
  dueDate: dto.dueDate,
  createdBy,
  ...(assignedTo ? { assignedTo } : {}),
});


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
    relations: ['assignedTo', 'createdBy', 'tasks'],
  });
}
async assignTasks(dto: AssignTasksToTopicDto): Promise<void> {
  const { topicId, taskIds } = dto;

  const topic = await this.topicRepo.findOne({ where: { id: topicId } });
  if (!topic) throw new NotFoundException('Topic not found');

 await this.taskRepo
  .createQueryBuilder()
  .update(Task)
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
    relations: ['assignedTo'],
  });
  if (!topic) throw new Error('Topic not found');

  const deadline = this.deadlineRepo.create({
    ...dto,
    topic,
  });

  const savedDeadline = await this.deadlineRepo.save(deadline);

  const internIds: number[] = [];

  if (topic.assignedTo) {
    // Topic riêng – 1 intern
    internIds.push(topic.assignedTo.id);
  } else {
    // Topic chung – tìm intern từ các task
    const raw = await this.taskRepo
      .createQueryBuilder('task')
      .select('DISTINCT task.assignedToId', 'internId')
      .where('task.topicId = :topicId', { topicId })
      .andWhere('task.assignedToId IS NOT NULL')
      .getRawMany();

    raw.forEach(r => internIds.push(r.internId));
  }

  const notifyPayload = {
    id: savedDeadline.id,
    requirement: dto.requirement,
    deadline: dto.deadline,
    topicId: topic.id,
    topicTitle: topic.title,
  };

  const message = `Bạn vừa được giao deadline mới trong topic "${topic.title}"`;

  for (const internId of internIds) {
    // 1. Gửi socket
    await this.topicGateway.sendDeadlineAssigned(internId, notifyPayload);

    // 2. Lưu DB
    await this.notificationsService.create(internId, message);

    // 3. Gửi push nếu có đăng ký
    const subs = await this.notificationsService.getSubscriptionsByUser(internId);
    for (const { subscription, id: subId } of subs) {
      try {
        await this.notificationsService.sendPushNotification(subscription, {
          title: 'Deadline mới',
          body: message,
          url: '/dashboard/interns/my-tasks',
          icon: '/icons/task-icon.png',
          badge: '/icons/badge.png',
        });
      } catch (err) {
        // Nếu bị lỗi 410 (expired/unsubscribed) thì xóa
        if (err.statusCode === 410 || err.body?.includes('unsubscribed')) {
          // await this.notificationsService.deleteSubscription(subId);
          console.warn(`Removed expired push subscription for user ${internId}`);
        } else {
          console.error(`Push failed for user ${internId}`, err);
        }
      }
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
// topic chung 
async getAllSharedTopics(userId: number): Promise<Topic[]> {
  console.log('Fetching all shared topics for user:', userId);
  return this.topicRepo.find({
    where: {
      assignedTo: IsNull(),
      createdBy: { id: userId },
    },
    relations: ['createdBy', 'tasks'],
    order: { id: 'DESC' },
  });
}



}
