import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { InternAssignment } from '../admin/entities/user.assign';
import { CreateMessageDto } from './dto/CreateMessageDto';
import { ChatGroup } from './entities/chat-group.entity';
import { User } from '../users/user.entity';
import { BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { ChatGateway } from './chat.gateway';
import { forwardRef, Inject } from '@nestjs/common';
@Injectable()
export class ChatService {
  constructor(
  @InjectRepository(Message) private messageRepo: Repository<Message>,
  @InjectRepository(InternAssignment) private assignmentRepo: Repository<InternAssignment>,
  @InjectRepository(ChatGroup) private groupRepo: Repository<ChatGroup>,
   @InjectRepository(User) private readonly userRepo: Repository<User>,
  @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway,
   
) {}
 async getMessagesByAssignment(assignmentId: number) {
    return this.messageRepo.find({
      where: { assignment: { id: assignmentId } },
      order: { sentAt: 'ASC' },
    });
  }
async saveMessage(dto: CreateMessageDto): Promise<Message> {
  const message = this.messageRepo.create({
    senderId: dto.senderId,
    message: dto.message,
  });

  if (dto.assignmentId) {
    const assignment = await this.assignmentRepo.findOneBy({ id: dto.assignmentId });
    if (!assignment) throw new NotFoundException('Assignment not found');
    message.assignment = assignment;
  } else if (dto.groupId) {
    const group = await this.groupRepo.findOneBy({ id: dto.groupId });
    if (!group) throw new NotFoundException('Group not found');
    message.group = group;
  } else {
    throw new NotFoundException('Missing assignmentId or groupId');
  }

  return this.messageRepo.save(message);
}
async getMessagesByGroup(groupId: number) {
  return this.messageRepo.find({
    where: { group: { id: groupId } },
    order: { sentAt: 'ASC' },
  });
}
async getAllGroups() {
  return this.groupRepo.find({
    relations: ['members'],
  });
}



async createGroup(name: string, memberIds: number[], creatorId: number) {
  if (!name || name.trim() === '') {
    throw new BadRequestException('Tên nhóm là bắt buộc.');
  }

  if (!memberIds || memberIds.length < 2) {
    throw new BadRequestException('Nhóm phải có ít nhất 2 thành viên.');
  }

  const users = await this.userRepo.find({
    where: { id: In(memberIds) },
  });

  if (users.length !== memberIds.length) {
    throw new BadRequestException('Một số thành viên không tồn tại.');
  }

  const group = this.groupRepo.create({
    name,
    members: users,
      creatorId
  });

  const savedGroup = await this.groupRepo.save(group);

  // Thông báo qua socket
  this.chatGateway.notifyNewGroup(savedGroup, memberIds);

  return savedGroup;
}




async getGroupsOfUser(userId: number, role: 'mentor' | 'intern') {
  if (role === 'mentor') {
    return this.groupRepo.find({
      where: { creatorId: userId },
      relations: ['members'],
    });
  } else {
    return this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'member')
      .where('member.id = :userId', { userId })
      .getMany();
  }
}



async getUserById(id: number) {
  return this.userRepo.findOne({
    where: { id },
    select: { name: true },
  });
}

async deleteGroup(groupId: number) {
  const group = await this.groupRepo.findOne({
    where: { id: groupId },
    relations: ['members'],
  });

  if (!group) {
    throw new Error(`Group with ID ${groupId} not found`);
  }

  const memberIds = group.members.map((m) => m.id);

  // Xóa group
  await this.groupRepo.remove(group);

  // Gửi thông báo tới tất cả thành viên
  this.chatGateway.notifyGroupDeleted(groupId, memberIds);
}


async addMembersToGroup(groupId: number, memberIds: number[]) {
  const group = await this.groupRepo.findOne({
    where: { id: groupId },
    relations: ['members'],
  });

  if (!group) {
    throw new Error(`Group with ID ${groupId} not found`);
  }

  const users = await this.userRepo.findByIds(memberIds);
  const newMembers = users.filter(
    (u) => !group.members.some((m) => m.id === u.id),
  );
  group.members.push(...newMembers);
  return this.groupRepo.save(group);
}


async removeMemberFromGroup(groupId: number, userId: number) {
  const group = await this.groupRepo.findOne({
    where: { id: groupId },
    relations: ['members'],
  });

  if (!group) {
    throw new Error(`Group with ID ${groupId} not found`);
  }

  group.members = group.members.filter((m) => m.id !== userId);
  return this.groupRepo.save(group);
}



async getGroupsCreatedByUser(userId: number) {
  return this.groupRepo.find({
    where: { creatorId: userId },
    relations: ['members'], 
  });
}


}