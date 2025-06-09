// mentors.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InternAssignment } from '../admin/entities/user.assign';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './entities/task.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
@Injectable()
export class MentorService {
  constructor(
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
      @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getInternsOfMentor(mentorId: number): Promise<User[]> {
    const assignments = await this.assignmentRepo.find({
      where: { mentor: { id: mentorId } },
      relations: ['intern'],
    });
    return assignments.map((a) => a.intern);
  }
   async assignTask(mentorId: number, dto: CreateTaskDto) {
    const intern = await this.userRepo.findOneBy({ id: dto.assignedTo });
    if (!intern || intern.type !== 'intern') throw new Error('Người nhận không hợp lệ');

    const task = this.taskRepo.create({
      ...dto,
      dueDate: new Date(dto.dueDate),
      assignedBy: { id: mentorId },
      assignedTo: intern,
    });

    return this.taskRepo.save(task);
  }
  async getTasksOfIntern(mentorId: number, internId: number) {

  return this.taskRepo.find({
    where: {
      assignedTo: { id: internId },
      assignedBy: { id: mentorId },
    },
    order: { dueDate: 'ASC' },
  });
}
 async markCompleted(taskId: number, mentorId: number) {
  const task = await this.taskRepo.findOne({
    where: {
      id: taskId,
      assignedBy: { id: mentorId }, 
    },
    relations: ['assignedBy'],
  });

  if (!task) {
    throw new NotFoundException('Task không tồn tại hoặc bạn không có quyền');
  }

  task.status = TaskStatus.COMPLETED;
  return this.taskRepo.save(task);
}
}
