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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Hung12122003',
      database: 'manage_intern',
      entities: [User, Mentor, Admin, Intern, InternAssignment, Task, Message,Notification,PushSubscription],
      synchronize: true,
    }),
//   RedisModule.forRootAsync({
//   useFactory: async () => ({
//     host: 'localhost',
//     port: 6379,
//   }),
// }),



    ScheduleModule.forRoot(),


    AuthModule,
    UsersModule,
    InternsModule,
    MentorsModule,
    AdminModule,
    TasksModule,
    MessageModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
