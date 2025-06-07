import { Module } from '@nestjs/common';
import { InternsController } from './interns.controller';
import { InternsService } from './interns.service';

@Module({
  controllers: [InternsController],
  providers: [InternsService]
})
export class InternsModule {}
