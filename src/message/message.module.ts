import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { ChatService } from './message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { InternAssignment } from '../admin/entities/user.assign';
import { ChatGateway } from './chat.gateway';
import { RedisClientProvider } from './redis.provider'; 
import { ChatSyncService } from './message.sync'; 
import { ChatGroup } from './entities/chat-group.entity';
import { ChatGroupController } from './chat-group.controller';
import { User } from '../users/user.entity'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, InternAssignment,ChatGroup,User]),
  ],
  controllers: [MessageController,ChatGroupController],
  providers: [
    RedisClientProvider,
    ChatService,
    ChatGateway,
    
     ChatSyncService,
  ],
  exports: [RedisClientProvider,ChatService,], 
})
export class MessageModule {}
