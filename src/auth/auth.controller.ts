// auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from './user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { Query } from '@nestjs/common';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  register(@Body() body: { email: string; password: string,role?: UserRole }) {
    return this.authService.register(body.email, body.password,body.role);
  }



  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      body.email,
      body.password,
    );


    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.authService.getProfile(user.sub);

  }
  @Post('refresh')
  async refresh(@Req() req: Request) {
    console.log('Cookies:', req.cookies); 
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const userId = this.authService.extractUserIdFromToken(refreshToken);
    const { accessToken } = await this.authService.refreshTokens(userId, refreshToken);
    return { accessToken };
  }
 @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists }; // trả về { exists: true } hoặc { exists: false }
  }
}
