import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { Raw } from 'typeorm';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

async findAllInternsAndMentors(): Promise<User[]> {
  return this.userRepo
    .createQueryBuilder('user')
    .where(`user.type IN (:...types)`, { types: ['intern', 'mentor'] })
    .orderBy('user.id', 'ASC')
    .getMany();
}

}
