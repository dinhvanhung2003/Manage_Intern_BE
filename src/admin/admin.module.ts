import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { InternAssignment } from './entities/user.assign';
@Module({
  imports: [TypeOrmModule.forFeature([User,InternAssignment])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

