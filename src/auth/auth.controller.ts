// auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from './user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; role: UserRole }) {
    return this.authService.register(body.email, body.password, body.role);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.authService.getProfile(req['user'].sub);
  }
}
