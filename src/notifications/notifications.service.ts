import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/user.notification';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async create(internId: number, message: string) {
    const notification = this.repo.create({
      intern: { id: internId },
      message,
    });
    return this.repo.save(notification);
  }

  async getByUser(internId: number) {
    return this.repo.find({
      where: { intern: { id: internId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAllAsRead(internId: number) {
    await this.repo.update(
      { intern: { id: internId }, isRead: false },
      { isRead: true },
    );
  }
}
