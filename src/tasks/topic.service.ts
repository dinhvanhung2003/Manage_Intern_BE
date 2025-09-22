import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Topic } from './entities/topic.entity';
import { CreateTopicDto } from './dtos/CreateTopicDTO';
import { User } from '../users/entities/user.entity';
import { AssignTasksToTopicDto } from './dtos/AssignTasksToTopicDto';
import { Task } from './entities/task.entity';
import { TopicDeadline } from './entities/topic-deadline.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TopicGateway } from './topic.gateway';
type ListNoTopicParams = { topicId?: number; mentorId?: number };
@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private readonly topicRepo: Repository<Topic>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(TopicDeadline) private readonly deadlineRepo: Repository<TopicDeadline>,
    private readonly topicGateway: TopicGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

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

    return this.topicRepo.save(topic);
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
    if (!topic) throw new NotFoundException(`Topic with id ${id} not found`);
    return topic;
  }

  async findByIntern(internId: number): Promise<Topic[]> {
    return this.topicRepo.find({
      where: { assignedTo: { id: internId } },
      relations: ['assignedTo', 'createdBy', 'tasks'],
    });
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

    const deadline = this.deadlineRepo.create({ ...dto, topic });
    const savedDeadline = await this.deadlineRepo.save(deadline);

    const internIds: number[] = [];
    if (topic.assignedTo) {
      internIds.push(topic.assignedTo.id);
    } else {
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
      await this.topicGateway.sendDeadlineAssigned(internId, notifyPayload);
      await this.notificationsService.create(internId, message);

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
          if (err.statusCode === 410 || err.body?.includes('unsubscribed')) {
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

  async getAllSharedTopics(userId: number): Promise<Topic[]> {
    return this.topicRepo.find({
      where: { assignedTo: IsNull(), createdBy: { id: userId } },
      relations: ['createdBy', 'tasks', 'tasks.assignedTo'],
      order: { id: 'DESC' },
    });
  }

  async getAllSharedTopicsForIntern(internId: number): Promise<Topic[]> {
    const topics = await this.topicRepo.find({
      where: { assignedTo: IsNull() },
      relations: ['createdBy', 'tasks', 'tasks.assignedTo'],
      order: { id: 'DESC' },
    });

    return topics
      .map(topic => ({
        ...topic,
        tasks: topic.tasks.filter(t => t.assignedTo?.id === internId),
      }))
      .filter(topic => topic.tasks.length > 0);
  }

  async listTasksInTopic(topicId: number): Promise<Task[]> {
    return this.taskRepo.find({
      where: { topic: { id: topicId } },
      relations: ['assignedTo'],
      order: { id: 'DESC' },
    });
  }

  async listAssigneesInTopic(topicId: number): Promise<number[]> {
    const raw = await this.taskRepo
      .createQueryBuilder('task')
      .select('DISTINCT task.assignedToId', 'internId')
      .where('task.topicId = :topicId', { topicId })
      .andWhere('task.assignedToId IS NOT NULL')
      .getRawMany<{ internId: number }>();

    return raw.map(r => r.internId);
  }

 // topic.service.ts
// topic.service.ts
async listTasksAssignedNoTopic({ topicId, mentorId }: ListNoTopicParams): Promise<Task[]> {
  const qb = this.taskRepo
    .createQueryBuilder('task')
    .leftJoinAndSelect('task.assignedTo', 'intern')
    .where('task.topicId IS NULL')
    .andWhere('task.assignedToId IS NOT NULL');

  

  if (mentorId) {
    
    qb.andWhere('intern.mentorId = :mentorId', { mentorId });

 
  }

  // --- LOẠI INTERN ĐÃ CÓ TASK TRONG TOPIC HIỆN TẠI ---
  if (topicId) {
    const existsSub = this.taskRepo
      .createQueryBuilder('t2')
      .select('1')
      .where('t2.topicId = :topicId', { topicId })
      .andWhere('t2.assignedToId = task.assignedToId'); // so intern theo assignedToId

    qb.andWhere(`NOT EXISTS (${existsSub.getQuery()})`)
      .setParameters(existsSub.getParameters());
  }

  return qb.orderBy('task.id', 'DESC').getMany();
}



  async assignTasks(dto: AssignTasksToTopicDto): Promise<{
    assignedTaskIds: number[];
    skippedTaskIds: number[];
    reason?: string;
  }> {
    const { topicId, taskIds } = dto;

    const topic = await this.topicRepo.findOne({ where: { id: topicId } });
    if (!topic) throw new NotFoundException('Topic not found');

    const existingInternIds = new Set(await this.listAssigneesInTopic(topicId));

    const tasks = await this.taskRepo.find({
      where: taskIds.map(id => ({ id })),
      relations: ['assignedTo'],
    });

    const toAssign: Task[] = [];
    const skipped: Task[] = [];

    for (const t of tasks) {
      const internId = t.assignedTo?.id;
      if (!internId || existingInternIds.has(internId)) {
        skipped.push(t);
      } else {
        toAssign.push(t);
        existingInternIds.add(internId);
      }
    }

    if (toAssign.length) {
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ topic })
        .whereInIds(toAssign.map(t => t.id))
        .execute();
    }

    return {
      assignedTaskIds: toAssign.map(t => t.id),
      skippedTaskIds: skipped.map(t => t.id),
      reason: skipped.length
        ? 'Một số task bị bỏ qua vì intern đã có task trong topic.'
        : undefined,
    };
  }
  
}
