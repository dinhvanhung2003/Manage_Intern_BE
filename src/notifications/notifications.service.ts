import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/user.notification';
import { Repository } from 'typeorm';
import { PushSubscription } from './entities/push.subscription';
import { User } from '../users/user.entity';
import * as webPush from 'web-push';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private readonly pushRepo: Repository<PushSubscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    webPush.setVapidDetails(
      'mailto:admin@yourdomain.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

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


  // cau hinh web-push 
 async saveSubscription(userId: number, subscription: any) {
  const user = await this.userRepo.findOneBy({ id: userId });
  if (!user) throw new Error('Không tìm thấy người dùng');

  
  const existing = await this.pushRepo.findOne({
    where: {
      user: { id: userId },
      subscription: { endpoint: subscription.endpoint }, 
    } as any,
  });

  if (existing) {
    existing.subscription = subscription; 
    return this.pushRepo.save(existing);
  }

  const entity = this.pushRepo.create({ subscription, user });
  return this.pushRepo.save(entity);
}


async notifyUser(userId: number, payload: {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}) {
  const subs = await this.getSubscriptionsByUser(userId);
  if (!subs.length) {
    console.warn(`❗ Không tìm thấy subscription cho user ${userId}`);
    return;
  }

  const enrichedPayload = {
    title: payload.title || 'Thông báo mới',
    body: payload.body || '',
    url: payload.url || '/dashboard/interns/my-tasks',
    icon: payload.icon || '/icons/task-icon.png',
  };

  for (const { subscription } of subs) {
    try {
      await this.sendPushNotification(subscription, enrichedPayload);
    } catch (error: any) {
      console.error(` Gửi push thất bại cho user ${userId}:`, error);

      // Nếu subscription không còn hợp lệ → xoá khỏi DB
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.pushRepo.delete({ subscription });
        console.warn(` Subscription đã bị xoá vì không còn hợp lệ`);
      }
    }
  }
}


  async getSubscriptionsByUser(userId: number) {
    return this.pushRepo.find({
      where: { user: { id: userId } }
    });
  }

  async sendPushNotification(subscription: any, payload: any) {
    try {
      const sub = typeof subscription === 'string'
        ? JSON.parse(subscription)
        : subscription;

      await webPush.sendNotification(sub, JSON.stringify(payload));
    } catch (error) {
      console.error('Gửi push thất bại:', error);
    }
  }

}
