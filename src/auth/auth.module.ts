import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import {Admin} from '../users/entities/user.admin.entity';
import {Mentor} from '../users/user.mentor';
import {Intern} from '../users/user.intern';
import {NotificationsService} from '../notifications/notifications.service';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forFeature([User,Admin,
      Mentor,
      Intern,]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'accessSecret',
      signOptions: { expiresIn: '1d' },
    }),
    NotificationsModule
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
})
export class AuthModule {}
