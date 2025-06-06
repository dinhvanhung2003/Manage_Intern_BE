import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }

  async register(email: string, password: string, role: UserRole) {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password: hashed, role });
    return this.userRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access' },
      {
        expiresIn: '30s',
        secret: process.env.JWT_ACCESS_SECRET || 'accessSecret',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'refresh' },
      {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'refreshSecret',
      },
    );


    console.log('ACCESS:', process.env.JWT_ACCESS_SECRET);
    console.log('REFRESH:', process.env.JWT_REFRESH_SECRET);
    await this.userRepo.update(user.id, {
      refreshToken: await bcrypt.hash(refreshToken, 10),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
  
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '30s',
      secret: process.env.JWT_ACCESS_SECRET || 'accessSecret',
    });

    return {
      accessToken: newAccessToken,
      // refreshToken,
    };
  }

  async getProfile(userId: number) {
    return this.userRepo.findOneBy({ id: userId });
  }
  extractUserIdFromToken(token: string): number {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refreshSecret',
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

