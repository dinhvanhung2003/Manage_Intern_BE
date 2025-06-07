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
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Hung12122003',
      database: 'manage_intern',
      entities: [User,Mentor,Admin,Intern],
      synchronize: true,       
    }),
    AuthModule,
    UsersModule,
    InternsModule,
    MentorsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
