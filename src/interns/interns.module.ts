import { Module } from '@nestjs/common';
import { InternsController } from './interns.controller';
import { InternsService } from './interns.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intern } from '../users/user.intern';
import { HttpModule } from '@nestjs/axios';
@Module({
   imports: [TypeOrmModule.forFeature([Intern]),HttpModule], 
  controllers: [InternsController],
  providers: [InternsService]
})
export class InternsModule {}
