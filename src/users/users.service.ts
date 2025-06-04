// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/user.entity';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.find({ select: ['id', 'email', 'role', 'bio'] });
  }

 async findOne(id: number): Promise<User> {
  const user = await this.userRepo.findOneBy({ id });
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return user;
}


  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
  await this.userRepo.update(id, userData);
  const updated = await this.findOne(id);
  if (!updated) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return updated;
}

  async delete(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }
}
