import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Intern } from '../users/user.intern';
import { Repository } from 'typeorm';
import { UpdateInternDto } from './dto/UpdateInternDTO';
import { TaskStatus } from '../tasks/entities/task.entity';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { Task } from '../tasks/entities/task.entity';
import { InternAssignment } from '../admin/entities/user.assign';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';


import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
@Injectable()
export class InternsService {
  constructor(
    @InjectRepository(Intern)
    private internRepo: Repository<Intern>,
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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
  async findTasksByIntern(internId: number, search: string) {
    const key = `intern:${internId}:search:${search || 'all'}`;
    const cached = await this.cacheManager.get(key);

    if (cached) {
      console.log(' Cache hit:', key);
      return cached;
    }
    const query = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .where('assignedTo.id = :internId', { internId });

    if (search) {
      const lowerSearch = search.toLowerCase();
      const statusMap: Record<string, string> = {
        'chưa nhận': 'assigned',
        'đang làm': 'in_progress',
        'hoàn thành': 'completed',
      };
      const mappedStatus = statusMap[lowerSearch] || null;

      query.andWhere(
        `(LOWER(task.title) LIKE :search 
        OR LOWER(task.description) LIKE :search
        ${mappedStatus ? ' OR task.status = :status' : ''}
      )`,
        {
          search: `%${lowerSearch}%`,
          ...(mappedStatus ? { status: mappedStatus } : {}),
        }
      );
    }

    return query.orderBy('task.dueDate', 'ASC').getMany();
  }


  // lay thong tin assignment cua intern
  async getAssignment(internId: number) {
    return this.assignmentRepo.findOne({
      where: { intern: { id: internId } },
      relations: ['mentor'],
    });
  }

  // upload file anh 
  async updateAvatar(userId: number, uploadedFile: any) {
    const avatarsDir = path.resolve(process.cwd(), 'uploads', 'avatars');

    // Tìm file avatar cũ (cùng userId, bất kỳ đuôi)
    const pattern = path.join(avatarsDir, `avatar-${userId}.*`);
    const existingFiles = glob.sync(pattern);

    // Xóa ảnh cũ
    for (const filePath of existingFiles) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Lỗi khi xóa file cũ: ${filePath}`, err);
      }
    }

    // Lấy phần mở rộng từ file mới
    const ext = path.extname(uploadedFile.originalname);
    const finalFileName = `avatar-${userId}${ext}`;
    const finalPath = path.join(avatarsDir, finalFileName);

    // Đổi tên file tạm sang tên chuẩn
    fs.renameSync(uploadedFile.path, finalPath);

    const avatarUrl = `/uploads/avatars/${finalFileName}`;
    await this.internRepo.update(userId, { avatarUrl });

    return {
      message: 'Đã cập nhật avatar duy nhất cho user',
      avatarUrl,
    };
  }
}
