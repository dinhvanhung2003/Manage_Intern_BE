import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskImage } from './entities/task.image';
import { BaseSoftDeleteService } from 'src/common/services/base-soft-delete.service';

@Injectable()
export class TaskService extends BaseSoftDeleteService<Task> {
  constructor(
    @InjectRepository(Task)
    repo: Repository<Task>,
    @InjectRepository(TaskImage)
    private readonly imageRepo: Repository<TaskImage>,
  ) {
    super(repo);
  }

  async uploadImage(taskId: number | undefined, url: string) {
    let image: TaskImage;

    if (taskId) {
      const task = await this.repo.findOneBy({ id: +taskId });
      if (!task) throw new Error('Task không tồn tại');
      image = this.imageRepo.create({ task, url });
    } else {
      image = this.imageRepo.create({ url });
    }

    return this.imageRepo.save(image);
  }

  async filterTasks(filters: {
    school?: string;
    status?: string;
    title?: string;
    mentorId?: number;
    dueDateFrom?: string;
    dueDateTo?: string;
  }): Promise<Task[]> {
    const query = this.repo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'intern')
      .leftJoinAndSelect('task.assignedBy', 'mentor');

    if (filters.title) {
      query.andWhere(`task.title ILIKE :keyword OR task.description ILIKE :keyword`, {
        keyword: `%${filters.title}%`,
      });
    }

    if (filters.status) query.andWhere('task.status = :status', { status: filters.status });
    if (filters.mentorId) query.andWhere('task.assignedBy.id = :mentorId', { mentorId: filters.mentorId });
    if (filters.school) query.andWhere('intern.school ILIKE :school', { school: `%${filters.school}%` });
    if (filters.dueDateFrom) query.andWhere('task.dueDate >= :from', { from: filters.dueDateFrom });
    if (filters.dueDateTo) query.andWhere('task.dueDate <= :to', { to: filters.dueDateTo });

    return await query.getMany();
  }




}
