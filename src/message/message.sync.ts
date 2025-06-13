import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { ChatService } from './message.service';

@Injectable()
export class ChatSyncService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly chatService: ChatService,
  ) {}

  @Cron('*/5 * * * *') // chạy mỗi 5 phút
  async syncRedisToDb() {
    const keys = await this.redis.keys('chat:assignment-*');

    for (const key of keys) {
      const assignmentId = parseInt(key.split('-')[1]);
      const messages = await this.redis.lrange(key, 0, -1);

      for (const m of messages) {
        const parsed = JSON.parse(m);
        await this.chatService.saveMessage({
          assignmentId,
          senderId: parsed.senderId,
          message: parsed.message,
          sentAt: new Date(parsed.sentAt),
        });
      }

      await this.redis.del(key);
    }

    console.log(`[Cron] Synced ${keys.length} chat rooms to DB.`);
  }
}
