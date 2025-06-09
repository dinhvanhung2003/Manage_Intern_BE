import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Mentor } from '../users/user.mentor';
import { Intern } from '../users/user.intern';
import { Admin } from '../users/user.admin';





@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,

    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    @InjectRepository(Mentor)
    private mentorRepo: Repository<Mentor>,

    @InjectRepository(Intern)
    private internRepo: Repository<Intern>,
  ) { }



  async register(email: string, password: string, type: string = 'intern') {
    const hashed = await bcrypt.hash(password, 10);

    let user: User;

  
    switch (type) {
      case 'admin':
        user = new Admin();
        break;
      case 'mentor':
        user = new Mentor();
        break;
      default:
        user = new Intern();
    }

    user.email = email;
    user.password = hashed;

    try {

      switch (type) {
        case 'admin':
          return await this.adminRepo.save(user as Admin);
        case 'mentor':
          return await this.mentorRepo.save(user as Mentor);
        default:
          return await this.internRepo.save(user as Intern);
      }
    } catch (error: any) {
      console.error('Đăng ký lỗi:', error);
      if (error.code === '23505') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw new InternalServerErrorException('Đăng ký thất bại');
    }
  }




  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      type: user.constructor.name.toLowerCase(),
    };

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: (user as any).type || user.constructor.name.toLowerCase(), tokenType: 'access', },
      {
        expiresIn: '10m',
        secret: process.env.JWT_ACCESS_SECRET || 'accessSecret',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id, email: user.email, type: (user as any).type || user.constructor.name.toLowerCase(),
        tokenType: 'refresh',
      },
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

    const payload = { sub: user.id, email: user.email, type: user.constructor.name.toLowerCase(), };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '10m',
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



  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    return !!user;
  }




}

