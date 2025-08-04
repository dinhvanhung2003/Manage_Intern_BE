// auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { Query } from '@nestjs/common';
import { CreateUserDto } from './dto/RegisterDTO';
import * as jwt from 'jsonwebtoken';
import { HttpStatus } from '@nestjs/common';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.authService.register(body.email, body.password, body.type);
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
    res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: false, // Đặt true nếu sử dụng HTTPS
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000 // 1 ngày

});


    // return { accessToken,refreshToken};
    return { message:'Login successfull'}
  }
  // Be đọc token 
  @Get('me')
@UseGuards(JwtAuthGuard)
getMe(@Req() req: Request) {
  const user = req.user as any;
  return {
    id: user.sub,
    email: user.email,
    type: user.type // role
  };
}
@Get('check')
  check(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      return res.status(HttpStatus.OK).json({ user: decoded });
    } catch (err) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid token' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.authService.getProfile(user.sub);

  }
  @Post('refresh')
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new UnauthorizedException('No refresh token found');
  }

  const userId = this.authService.extractUserIdFromToken(refreshToken);
  const { accessToken } = await this.authService.refreshTokens(userId, refreshToken);

  // Set lại accessToken mới vào cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1 * 60 * 1000, // 1 phút
  });

  return { message: 'Access token refreshed successfully' };
}

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists }; // trả về { exists: true } hoặc { exists: false }
  }


 @Post('logout')
async logout(@Req() req, @Res() res: Response) {
  const userId = req.user?.id; 
  if (userId) {
    // Xóa refresh token trong DB
    await this.authService.invalidateRefreshToken(userId);
  }
 res.cookie('accessToken', '', {
    httpOnly: true,
    secure: false, // nếu dùng HTTPS
    sameSite: 'strict',
    expires: new Date(0), // hết hạn ngay lập tức
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    expires: new Date(0),
  });

  return res.status(HttpStatus.OK).json({ message: 'Logged out' });
}


}
