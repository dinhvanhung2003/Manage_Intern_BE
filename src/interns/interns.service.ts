import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Intern } from '../users/user.intern';
import { Repository } from 'typeorm';
import {UpdateInternDto} from './dto/UpdateInternDTO';
@Injectable()
export class InternsService {
  constructor(
    @InjectRepository(Intern)
    private internRepo: Repository<Intern>,
  ) {}

  async getProfile(id: number): Promise<Intern> {
    const intern = await this.internRepo.findOne({ where: { id } });
    if (!intern) {
      throw new NotFoundException('Intern not found');
    }
    return intern;
  }

  async updateProfile(id: number, updateData: Partial<UpdateInternDto>): Promise<Intern> {
    await this.internRepo.update(id, updateData);
    return this.getProfile(id);
  }
}
