import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import {Admin} from '../users/user.admin';
import {Mentor} from '../users/user.mentor';
import {Intern} from '../users/user.intern';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forFeature([User,Admin,
      Mentor,
      Intern,]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'accessSecret',
      signOptions: { expiresIn: '10m' },
    }),
    
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
})
export class AuthModule {}
