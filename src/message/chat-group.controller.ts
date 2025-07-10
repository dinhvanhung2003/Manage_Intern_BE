// src/message/chat-group.controller.ts

import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatService } from './message.service';
import { Req } from '@nestjs/common/decorators/http/route-params.decorator';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import { Delete} from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Param } from '@nestjs/common/decorators/http/route-params.decorator';
import { ChatGroup } from './entities/chat-group.entity';
@UseGuards(JwtAuthGuard)
@Controller('chat-groups')
export class ChatGroupController {
  constructor(private readonly chatService: ChatService,
              private readonly chatGateway: ChatGateway)
   {}

  @Get()
  async getAllGroups() {
    return this.chatService.getAllGroups();
  }

  @Post()
async createGroup(
  @Body() body: { name: string; memberIds: number[] },
  @Req() req: any
) {
  const creatorId = req.user.sub;

  const group = await this.chatService.createGroup(body.name, body.memberIds, creatorId);

  this.chatGateway.notifyNewGroup(group, body.memberIds);

  return group;
}

 @Get('my')
async getGroupsOfUser(@Req() req: any) {
  const userId = req.user.sub;
  const role = req.user.role; 

  return this.chatService.getGroupsOfUser(userId, role);
}

@Delete(':id')
async deleteGroup(@Param('id') id: number) {
  await this.chatService.deleteGroup(id);
  return { success: true };
}
@Post(':id/add-members')
async addMembers(
  @Param('id') id: number,
  @Body('memberIds') memberIds: number[],
) {
  const group = await this.chatService.addMembersToGroup(id, memberIds);

  // Socket: thông báo tới client
  this.chatGateway.notifyGroupEdit(group);

  return group;
}
@Post(':id/remove-member')
async removeMember(
  @Param('id') id: number,
  @Body('userId') userId: number,
) {
  const group = await this.chatService.removeMemberFromGroup(id, userId);

  // Socket: thông báo tới client
  this.chatGateway.notifyGroupEdit(group);

  return group;
}
@Get('created-by-me')
async getGroupsCreatedByMe(@Req() req: any) {
  const userId = req.user.sub;
  return this.chatService.getGroupsCreatedByUser(userId);
}
}
