// mentors.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InternAssignment } from '../admin/entities/user.assign.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/CreatTaskDto';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/entities/task.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { taskQueue } from '../queues/user.queue';
import { Not, IsNull } from 'typeorm';
import { TaskGateway } from './task.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Intern } from '../users/user.intern';
import { TaskStatusLogService } from '../tasks/services/task-status-log.service';
import {Document} from '../tasks/entities/document.entity'
import { In } from 'typeorm';
import { Panigated } from '../types/paginated';
import { Topic } from '@tasks/entities/topic.entity';
const STATUS_LABELS: Record<string, string> = {
  assigned: 'Chưa nhận',
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  error: 'Lỗi',
};

@Injectable()
export class MentorService {
  constructor(
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly taskGateway: TaskGateway,
    private readonly notificationsService: NotificationsService,
    private readonly taskStatusLogService: TaskStatusLogService,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) { }

 // mentor.service.ts
async getInternsOfMentor(
  mentorId: number,
  page = 1,
  limit = 10,
  search?: string,
): Promise<Panigated<Intern>> {
  const qb = this.assignmentRepo
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.intern', 'intern')
    .where('a.mentorId = :mentorId', { mentorId });

  if (search && search.trim()) {
    const keyword = `%${search.trim()}%`;
    qb.andWhere(
      `(intern.name ILIKE :kw OR intern.email ILIKE :kw OR intern.school ILIKE :kw)`,
      { kw: keyword },
    );
  }

  // Sắp xếp tùy ý
  qb.orderBy('intern.name', 'ASC');

  // Phân trang
  const offset = (page - 1) * limit;
  qb.skip(offset).take(limit);

  const [assignments, count] = await qb.getManyAndCount();

  // Map ra interns (trường hợp 1 intern có nhiều assignment thì unique theo id)
  const map = new Map<number, Intern>();
  for (const a of assignments) {
    const i = a.intern as Intern;
    if (!map.has(i.id)) map.set(i.id, i);
  }
  const items = Array.from(map.values());

  return { items, total: count, page, limit };
}


  // phân công nhiệm vụ cho intern
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
if (dto.documentIds && dto.documentIds.length > 0) {
    const documents = await this.documentRepo.find({
  where: { id: In(dto.documentIds) },
  relations: ['sharedWithTasks'],
});


    for (const doc of documents) {
      // Tránh duplicate
      const exists = doc.sharedWithTasks?.some(t => t.id === savedTask.id);
      if (!exists) {
        doc.sharedWithTasks = [...(doc.sharedWithTasks || []), savedTask];
        await this.documentRepo.save(doc);
      }
    }
  }

    if (intern) {
      const message = `Bạn vừa được giao task: ${savedTask.title}`;

      // Gửi socket real-time nếu online
      await this.taskGateway.sendTaskAssigned(intern.id, savedTask);

      // Lưu thông báo trong DB
      await this.notificationsService.create(intern.id, message);

      // Gửi push notification
        await this.notificationsService.notifyUser(intern.id, {
      title: 'Nhiệm vụ mới',
      body: message,
    });
    

    }

    return savedTask;
  }

  // lấy danh sách task của 1 intern
  async getTasksOfIntern(mentorId: number, internId: number) {

    return this.taskRepo.find({
      where: {
        assignedTo: { id: internId },
        assignedBy: { id: mentorId },
      },
      order: { dueDate: 'ASC' },
    });
  }

  // đánh dấu task đã hoàn thành
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
  // fake task

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

  // lấy phân công
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


  // Quản lý task  của mình
  async getAllTasksCreatedByMentor(
    mentorId: number,
    title?: string,
    page = 1,
    limit = 10,
    unassignedOnly = false,
  ) {
    const query = this.taskRepo
  .createQueryBuilder('task')
  .leftJoinAndSelect('task.assignedTo', 'intern')
  .leftJoinAndSelect('task.sharedDocuments', 'sharedDocuments')
  .leftJoinAndSelect('sharedDocuments.files', 'files')
  .where('task.assignedById = :mentorId', { mentorId });


    if (title) {
      query.andWhere('task.title ILIKE :title', { title: `%${title}%` });
    }

    if (unassignedOnly) {
      query.andWhere('task."assignedToId" IS NULL');
    }

    const [data, total] = await query
      .orderBy('task.dueDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


async getTasksAssignedWithoutTopic(mentorId: number) {
  return this.taskRepo.find({
    where: {
      assignedBy: { id: mentorId },
      assignedTo: Not(IsNull()),
      topic: IsNull(),
    },
    relations: ['assignedTo'],
    order: { id: 'DESC' },
  });
}



  // async deleteTask(taskId: number, mentorId: number) {
  //   await this.taskRepo.find({
  //     where: {
  //       assignedBy: { id: mentorId },
  //       deletedAt: IsNull(), // thêm điều kiện này
  //     },
  //   });

  //   //   relations: ['images'], //  load images file nào xoá
  //   // });

  //   // if (!task) throw new NotFoundException('Task không tồn tại hoặc bạn không có quyền');

  //   // // Xoá file vật lý
  //   // for (const image of task.images || []) {
  //   //   const url = image.url;
  //   //   if (!url) continue; // nếu url bị undefined thì bỏ qua

  //   //   const filename = url.split('/').pop();
  //   //   if (!filename) continue; // nếu không tách được filename

  //   //   const filepath = join(__dirname, '..', '..', 'uploads', 'tasks', filename);
  //   //   try {
  //   //     await unlink(filepath); // xoá file vật lý
  //   //   } catch (err) {
  //   //     console.warn(`Không thể xoá file: ${filepath}`, err.message);
  //   //   }
  //   // }
  //   await this.taskRepo.softRemove(task);
  // }
  // xóa task
  async deleteTask(taskId: number, mentorId: number) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        assignedBy: { id: mentorId },
        deletedAt: IsNull(),
      },
      relations: ['images'],
      withDeleted: false, // chỉ lấy task chưa bị xóa
    });

    if (!task) {
      throw new NotFoundException('Task không tồn tại hoặc bạn không có quyền');
    }

    // Xoá file vật lý
    for (const image of task.images || []) {
      const url = image.url;
      if (!url) continue;

      const filename = url.split('/').pop();
      if (!filename) continue;

      const filepath = join(__dirname, '..', '..', 'uploads', 'tasks', filename);
      try {
        await unlink(filepath);
      } catch (err) {
        console.warn(`Không thể xoá file: ${filepath}`, err.message);
      }
    }

    // soft delete 
    await this.taskRepo.softRemove(task);
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

    this.taskGateway.sendTaskAssigned(intern.id, saved);

    return saved;
  }

  async restoreTask(taskId: number, mentorId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      withDeleted: true,
      relations: ['assignedBy'], // 
    });

    if (!task || task.assignedBy.id !== mentorId) {
      throw new NotFoundException('Không tìm thấy task hoặc bạn không có quyền');
    }

    return this.taskRepo.restore(taskId);
  }



  //lay danh sach task bi xoa 
  async getDeletedTasks(mentorId: number) {
    return this.taskRepo.find({
      where: {
        assignedBy: { id: mentorId },
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      relations: ['assignedTo'],
      order: { deletedAt: 'DESC' },
    });
  }


  // tao task ma chua phan cong cho ai 
  async assignTaskToIntern(taskId: number, internId: number, mentorId: number) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        assignedBy: { id: mentorId },
      },
    });
    if (!task) {
      throw new NotFoundException('Task không tồn tại hoặc không thuộc mentor');
    }

    if (task.assignedTo) {
      throw new BadRequestException('Task đã được giao cho intern khác');
    }

    task.assignedTo = { id: internId } as any;
    return await this.taskRepo.save(task);
  }
  // Cập nhật trạng thái task từ mentor
  async updateTaskStatusByMentor(taskId: number, mentorId: number, newStatus: TaskStatus, note?: string,) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, assignedBy: { id: mentorId } },
      relations: ['assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task không tồn tại hoặc không thuộc quyền của bạn');
    }

    const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.ASSIGNED]: [],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.ERROR],
      [TaskStatus.ERROR]: [TaskStatus.ASSIGNED],
      [TaskStatus.COMPLETED]: [TaskStatus.ASSIGNED],
    };

    const validTargets = allowedTransitions[task.status];
    if (!validTargets.includes(newStatus)) {
      throw new ForbiddenException(`Không thể chuyển trạng thái từ ${task.status} sang ${newStatus}`);
    }

    const fromStatus = task.status; //  khai báo 
    task.status = newStatus;
    const internInfo = task.assignedTo
      ? `Intern #${task.assignedTo.id} (${task.assignedTo.name || task.assignedTo.email})`
      : 'Intern không xác định';
    //  Ghi log
    await this.taskStatusLogService.createLog({
      taskId: task.id,
      userId: mentorId,
      fromStatus,
      toStatus: newStatus,
      note: note,
      message: `Mentor #${mentorId} cập nhật trạng thái cho ${internInfo}: từ "${STATUS_LABELS[fromStatus]}" sang "${STATUS_LABELS[newStatus]}"`,
      fileUrl: task.submittedFile || '',
    });

    return this.taskRepo.save(task);
  }







  // phân tích ở dashboard cho mentor
 // NestJS hoặc tương tự
async getInternStatistics(
  mentorId: number,
  type: string,
  month?: number,
  year?: number
) {
  const queryBuilder = this.assignmentRepo
    .createQueryBuilder('assignment')
    .leftJoin('assignment.intern', 'intern')
    .where('assignment.mentorId = :mentorId', { mentorId });

  const now = new Date();
  let start: Date;
  let end: Date;
  let groupByMonth = false;

  if (type === 'this_month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  }

  else if (type === 'last_month') {
    const isJan = now.getMonth() === 0;
    const year = isJan ? now.getFullYear() - 1 : now.getFullYear();
    const month = isJan ? 11 : now.getMonth() - 1;
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  }

  else if (type === 'this_year') {
    const year = now.getFullYear();
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
    groupByMonth = true;
  }

  else if (type === 'last_year') {
    const year = now.getFullYear() - 1;
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
    groupByMonth = true;
  }

  else if (type === '6months') {
    end = new Date();
    start = new Date();
    start.setMonth(end.getMonth() - 5);
    start.setDate(1);
    groupByMonth = true;
  }

  else if (type === 'custom') {
    if (!month || !year) throw new Error('Missing month or year');
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0);
  }

  else {
    throw new Error('Invalid type');
  }

  // Apply date filter
  queryBuilder.andWhere('assignment.startDate BETWEEN :start AND :end', {
    start,
    end,
  });

  const interns = await queryBuilder.getMany();

  if (groupByMonth) {
    const stats: Record<string, Record<string, number>> = {};
    const baseYear = start.getFullYear();
    const endYear = end.getFullYear();
    const monthsRange = new Set<string>();

    let current = new Date(start);
    while (current <= end) {
      const key = `${String(current.getMonth() + 1).padStart(2, '0')}`;
      stats[key] = { [current.getFullYear()]: 0 };
      monthsRange.add(`${current.getFullYear()}-${key}`);
      current.setMonth(current.getMonth() + 1);
    }

    for (const a of interns) {
      const date = a.startDate;
      const m = `${String(date.getMonth() + 1).padStart(2, '0')}`;
      const y = date.getFullYear();
      const key = m;

      if (!stats[key]) stats[key] = {};
      if (!stats[key][y]) stats[key][y] = 0;

      stats[key][y]++;
    }

    return stats;
  } else {
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const stats: Record<string, Record<string, number>> = {};
    stats[key] = { [start.getFullYear()]: interns.length };
    return stats;
  }
}




// phân tích tổng quan 


async getDashboardSummary(mentorId: number) {
  const [internCount, taskCount, topicCount, completedTaskCount] = await Promise.all([
    // Đếm số intern trực tiếp gán mentor
    this.userRepo.count({
      where: {
        type: 'intern',
        mentorId: mentorId,
      },
    }),

    // Đếm số task do mentor tạo topic
     this.taskRepo.count({
    where: {
      assignedBy: { id: mentorId },
    },
  }),

    // Đếm số topic
    this.topicRepo.count({
      where: { createdBy: { id: mentorId } }, // hoặc `{ createdById: mentorId }`
    }),

    // Đếm số task đã hoàn thành
    this.taskRepo
      .createQueryBuilder('task')
      .leftJoin('task.topic', 'topic')
      .where('topic.createdBy = :mentorId', { mentorId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .getCount(),
  ]);

  const completionRate =
    taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100);

  return {
    interns: internCount,
    tasks: taskCount,
    topics: topicCount,
    completion: completionRate,
  };
}






}
