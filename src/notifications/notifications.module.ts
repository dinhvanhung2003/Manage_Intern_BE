import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/user.notification';
import { PushSubscription } from './entities/push.subscription';
import { User } from '../users/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Notification,PushSubscription,User])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
