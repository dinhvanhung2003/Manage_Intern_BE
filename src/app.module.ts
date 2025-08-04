import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { InternsModule } from './interns/interns.module';
import { MentorsModule } from './mentors/mentors.module';
import { AdminModule } from './admin/admin.module';
import { Mentor } from './users/user.mentor';
import { Admin } from './users/user.admin';
import { Intern } from './users/user.intern';
import { InternAssignment } from './admin/entities/user.assign';
import { Task } from './tasks/entities/task.entity';
import { TasksModule } from './tasks/tasks.module';
import { MessageModule } from './message/message.module';
import { Message } from './message/entities/message.entity';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisOptions } from 'ioredis';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Notification } from './notifications/entities/user.notification';
import { NotificationsModule } from './notifications/notifications.module';
import { PushSubscription } from './notifications/entities/push.subscription';
import {TaskImage} from './tasks/entities/task.image';
import { CommonController } from './common/controllers/common-controller';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { TaskStatusLog } from './tasks/entities/task.log';
import * as redisStore from 'cache-manager-ioredis';
import { ChatGroup } from './message/entities/chat-group.entity';
import {Topic} from './tasks/entities/topic.entity';
import {TopicDeadline} from './tasks/entities/topic-deadline';
import {Document} from './tasks/entities/document.entity';
import { DocumentFile } from './tasks/entities/document-file';
import { SeedController } from './common/controllers/seed-task-topic-common.controller';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Hung12122003',
      database: 'manage_intern',
      entities: [User, Mentor, Admin, Intern, InternAssignment, Task, Message,Notification,PushSubscription,TaskImage,TaskStatusLog,ChatGroup,Topic,TopicDeadline
        ,Document,DocumentFile
      ],
      synchronize: true,
    }),
//   RedisModule.forRootAsync({
//   useFactory: async () => ({
//     host: 'localhost',
//     port: 6379,
//   }),
// }),
 CacheModule.registerAsync({
      isGlobal: true, 
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 300, 
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    InternsModule,
    MentorsModule,
    AdminModule,
    TasksModule,
    MessageModule,
    NotificationsModule,
    HttpModule
    
  ],
  controllers: [AppController,CommonController,SeedController],
  providers: [AppService],
})
export class AppModule { }
