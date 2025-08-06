// src/modules/seed/seed.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { taskQueue } from '../../queues/user.queue';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Controller('seed')
export class SeedController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('assigned-tasks')
  async seedAssignedTasks(@Body() body: { topicId: number; mentorId: number }) {
    const { topicId, mentorId } = body;

    // Lấy danh sách intern
    const interns = await this.userRepo.find({
      where: { type: 'intern' },
      select: ['id'],
    });

    if (interns.length === 0) {
      return { message: 'Không có intern nào để gán task' };
    }

    //  Đẩy 3000 task vào hàng đợi
    for (let i = 0; i < 3000; i++) {
      const randomIntern = interns[Math.floor(Math.random() * interns.length)];

      await taskQueue.add('create', {
        title: `Auto Task ${i + 1}`,
        description: `Mô tả cho task ${i + 1}`,
        createdById: 71,
        assignedToId: randomIntern.id,  //  Gán intern
        topicId:9, //  Gán topic
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 ngày
      });
    }

    return { message: 'Đã đẩy 3000 task gán cho intern vào queue' };
  }
}
