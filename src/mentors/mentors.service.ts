// mentors.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InternAssignment } from '../admin/entities/user.assign';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/entities/task.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { taskQueue } from '../queues/user.queue';
import { BulkJobOptions } from 'bullmq';
import { Not, IsNull } from 'typeorm';
import { TaskGateway } from './task.gateway';
@Injectable()
export class MentorService {
  constructor(
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly taskGateway: TaskGateway,
  ) { }

  async getInternsOfMentor(mentorId: number): Promise<User[]> {
    const assignments = await this.assignmentRepo.find({
      where: { mentor: { id: mentorId } },
      relations: ['intern'],
    });
    return assignments.map((a) => a.intern);
  }
  async assignTask(mentorId: number, dto: CreateTaskDto) {
  let intern: User | null = null;

  if (dto.assignedTo) {
    intern = await this.userRepo.findOneBy({ id: dto.assignedTo });
    if (!intern || intern.type !== 'intern') {
      throw new Error('Người nhận không hợp lệ');
    }
  }

  const task = this.taskRepo.create({
    ...dto,
    dueDate: new Date(dto.dueDate),
    assignedBy: { id: mentorId },
    assignedTo: intern ?? null,
  });

  const savedTask = await this.taskRepo.save(task);

  if (intern) {
    this.taskGateway.sendTaskAssigned(intern.id, savedTask);
  }

  return savedTask;
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
  // message queue
  async seedTasks() {
    const assignments = await this.assignmentRepo.find({
      relations: ['intern', 'mentor'], // load đủ intern + mentor
    });

    const jobs: { name: string; data: any }[] = [];

    for (let i = 0; i < 10000; i++) {
      const assignment = assignments[Math.floor(Math.random() * assignments.length)];
      const intern = assignment.intern;
      const mentor = assignment.mentor;

      if (!intern || !mentor) {
        console.warn(` Bỏ qua assignment vì thiếu intern hoặc mentor`);
        continue;
      }

      jobs.push({
        name: 'create',
        data: {
          index: i,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          assignedTo: intern.id,
          assignedBy: mentor.id,
          dueDate: new Date(Date.now() + Math.random() * 30 * 86400000),
        },
      });
    }

    await taskQueue.addBulk(jobs);
    return { message: ` Đã đẩy ${jobs.length} task vào queue từ bảng intern_assignments` };
  }

  async getAssignmentByMentor(mentorId: number) {
    return this.assignmentRepo.findOne({
      where: { mentorId },
      relations: ['intern'],
    });
  }
  async getAssignmentsByMentor(mentorId: number) {
    const assignments = await this.assignmentRepo.find({
      where: { mentor: { id: mentorId } },
      relations: ['intern'],
    });

    return assignments.map((a) => ({
      id: a.id,
      internId: a.intern.id,
      internName: a.intern.name || a.intern.email,
    }));
  }


  // Quản lý task 
  async getAllTasksCreatedByMentor(mentorId: number) {
    return this.taskRepo.find({
      where: { assignedBy: { id: mentorId } },
      relations: ['assignedTo'],
      order: { dueDate: 'ASC' },
    });
  }

  async deleteTask(taskId: number, mentorId: number) {
    const task = await this.taskRepo.findOneBy({ id: taskId, assignedBy: { id: mentorId } });
    if (!task) throw new NotFoundException('Task không tồn tại hoặc bạn không có quyền');
    return this.taskRepo.remove(task);
  }

  async updateTask(taskId: number, mentorId: number, dto: Partial<CreateTaskDto>) {
    const task = await this.taskRepo.findOneBy({ id: taskId, assignedBy: { id: mentorId } });
    if (!task) throw new NotFoundException('Không tìm thấy task');

    Object.assign(task, dto, {
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    });
    return this.taskRepo.save(task);
  }

  async reassignTask(taskId: number, internId: number) {
    const originalTask = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignedBy'],
    });

    if (!originalTask) {
      throw new NotFoundException('Không tìm thấy task gốc');
    }

    const intern = await this.userRepo.findOneBy({ id: internId });
    if (!intern) {
      throw new NotFoundException('Intern không tồn tại');
    }

    const newTask = this.taskRepo.create({
      title: originalTask.title,
      description: originalTask.description,
      dueDate: originalTask.dueDate,
      status: TaskStatus.ASSIGNED,
      assignedBy: originalTask.assignedBy,
      assignedTo: intern,
    });

    const saved = await this.taskRepo.save(newTask);

    this.taskGateway.sendTaskAssigned(intern.id, saved); // 👈 Gửi socket thông báo

    return saved;
  }




}
