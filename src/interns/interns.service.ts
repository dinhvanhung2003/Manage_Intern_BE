import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Intern } from '../users/user.intern';
import { Repository } from 'typeorm';
import { UpdateInternDto } from './dto/UpdateInternDTO';
import { TaskStatus } from '../mentors/entities/task.entity';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { Task } from '../mentors/entities/task.entity';
import { InternAssignment } from '../admin/entities/user.assign';
@Injectable()
export class InternsService {
  constructor(
    @InjectRepository(Intern)
    private internRepo: Repository<Intern>,
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>
  ) { }

  async getProfile(id: number): Promise<Intern> {
    const intern = await this.internRepo.findOne({ where: { id } });
    if (!intern) {
      throw new NotFoundException('Intern not found');
    }
    return intern;
  }

  async updateProfile(id: number, updateData: Partial<UpdateInternDto>): Promise<Intern> {
    await this.internRepo.update(id, updateData);
    return this.getProfile(id);
  }

  async updateStatus(taskId: number, internId: number, status: TaskStatus) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        assignedTo: { id: internId },
      },
      relations: ['assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task không tồn tại hoặc không thuộc về bạn');
    }

    if (task.status !== TaskStatus.ASSIGNED) {
      throw new ForbiddenException('Chỉ được chấp nhận task ở trạng thái "assigned"');
    }

    task.status = status;
    return this.taskRepo.save(task);
  }
  async findTasksByIntern(internId: number) {
  return this.taskRepo.find({
    where: { assignedTo: { id: internId } },
    relations: ['assignedTo', 'assignedBy'], 
    order: { dueDate: 'ASC' },
  });
}
  async getAssignment(internId: number) {
    return this.assignmentRepo.findOne({
      where: { intern: { id: internId } },
      relations: ['mentor'],
    });
  }
}
