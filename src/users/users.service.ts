// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { NotFoundException } from '@nestjs/common';
import { userQueue } from '../queues/user.queue';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  findAll(): Promise<User[]> {

    return this.userRepo.find({ select: ['id', 'email', 'bio', 'name'] });
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
  async findByType(type: string): Promise<User[]> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('"user"."type" = :type', { type })
      .getMany();
  }
  //message queue 

  async seedUsers() {
    // for (let i = 0; i < 100; i++) {
    //   await userQueue.add('create', {
    //     name: `Mentor ${i}`,
    //     email: `mentor${i}@mail.com`,
    //     type: 'mentor',
    //   });
    // }

    for (let i = 0; i < 1000; i++) {
      // const mentorId = Math.floor(Math.random() * 100) + 1;
      await userQueue.add('create', {
        name: `Intern ${i}`,
        email: `intern${i}@mail.com`,
        type: 'intern',
        mentorId: 71,
      });
    }

    return { message: 'Seeded 3000 interns to queue' };
  }




}
