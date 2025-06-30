import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { ChatService } from './message.service';
import { ModuleRef } from '@nestjs/core';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private chatService: ChatService;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly moduleRef: ModuleRef, 
  ) {}


  async onModuleInit() {
    this.chatService = this.moduleRef.get(ChatService, { strict: false });
  }

  // ===== 1:1 chat =====
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() assignmentId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `assignment-${assignmentId}`;
    client.join(room);

    const raw = await this.redis.lrange(`chat:${room}`, 0, -1);
    const messages = raw.map((m) => JSON.parse(m));
    client.emit('receive_message_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() msg: any) {
    const room = `assignment-${msg.assignmentId}`;
    const message = {
      senderId: msg.senderId,
      message: msg.message,
      sentAt: new Date().toISOString(),
    };

    await this.redis.rpush(`chat:${room}`, JSON.stringify(message));
    await this.redis.expire(`chat:${room}`, 86400);

    await this.chatService.saveMessage({
      assignmentId: msg.assignmentId,
      senderId: msg.senderId,
      message: msg.message,
    });

    this.server.to(room).emit('receive_message', message);
  }

  // ===== group chat =====
  @SubscribeMessage('join_group')
  async handleJoinGroup(
    @MessageBody() groupId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `group-${groupId}`;
    client.join(room);

    const raw = await this.redis.lrange(`chat:${room}`, 0, -1);
    const messages = raw.map((m) => JSON.parse(m));
    client.emit('receive_group_history', messages);
  }

  @SubscribeMessage('send_group_message')
  async handleSendGroupMessage(@MessageBody() msg: any) {
    const room = `group-${msg.groupId}`;
    const user = await this.chatService.getUserById(msg.senderId);

    const message = {
      senderId: msg.senderId,
      message: msg.message,
      senderName: user?.name ?? `User ${msg.senderId}`,
      sentAt: new Date().toISOString(),
    };

    await this.redis.rpush(`chat:${room}`, JSON.stringify(message));
    await this.redis.expire(`chat:${room}`, 86400);

    await this.chatService.saveMessage({
      groupId: msg.groupId,
      senderId: msg.senderId,
      message: msg.message,
    });

    this.server.to(room).emit('receive_group_message', message);
  }

  notifyNewGroup(group: any, memberIds: number[]) {
    for (const userId of memberIds) {
      this.server.to(`user-${userId}`).emit('new_group_created', group);
    }
  }
  @SubscribeMessage('join_user_room')
handleJoinUserRoom(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
  client.join(`user-${userId}`);
  console.log(`User ${userId} joined room user-${userId}`);
}
notifyGroupEdit(group: any) {
  const memberIds = group.members.map((m: any) => m.id);
  for (const userId of memberIds) {
    this.server.to(`user-${userId}`).emit('group_edited', group);
  }
}
notifyGroupDeleted(groupId: number, memberIds: number[]) {
  for (const userId of memberIds) {
    this.server.to(`user-${userId}`).emit('group_deleted', groupId);
  }
}



}
