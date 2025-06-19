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
}
