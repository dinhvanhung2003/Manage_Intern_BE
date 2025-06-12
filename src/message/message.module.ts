import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { ChatService } from './message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { InternAssignment } from '../admin/entities/user.assign'; 
import { ChatGateway } from './chat.gateway';
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, InternAssignment]) 
  ],
  controllers: [MessageController],
  providers: [ChatService,ChatGateway]
})
export class MessageModule {}
