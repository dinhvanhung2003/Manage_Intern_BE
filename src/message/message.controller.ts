import { Controller, Get, Param, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ChatService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly chatService: ChatService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis, 
  ) {}

  @Get(':assignmentId')
  async getMessages(@Param('assignmentId') id: string) {
    const redisKey = `chat:assignment-${id}`;

    // Lấy tin nhắn tạm thời từ Redis
    const redisMsgs = await this.redis.lrange(redisKey, 0, -1);
    const parsedRedis = redisMsgs.map((m) => JSON.parse(m));

    // Lấy tin nhắn cũ từ DB
    const dbMsgs = await this.chatService.getMessagesByAssignment(Number(id));

    // Gộp 2 nguồn
    return [...dbMsgs, ...parsedRedis];
  }
  @Get('group/:groupId')
async getGroupMessages(@Param('groupId') groupId: string) {
  const redisKey = `chat:group-${groupId}`;
  const redisMsgs = await this.redis.lrange(redisKey, 0, -1);
  const parsedRedis = redisMsgs.map((m) => JSON.parse(m));

  const dbMsgs = await this.chatService.getMessagesByGroup(Number(groupId));
  return [...dbMsgs, ...parsedRedis];
}



}
