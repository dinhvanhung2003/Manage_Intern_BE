// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { Request } from 'express';
// import { InjectRepository } from '@nestjs/typeorm';
// import { User } from '../users/user.entity';
// import { Repository } from 'typeorm';
// import { UnauthorizedException } from '@nestjs/common';
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(
//     configService: ConfigService,
//     @InjectRepository(User) private userRepo: Repository<User>
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req: Request) => req?.cookies?.accessToken || null,
//       ]),
//       secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
//     });
//   }

//   async validate(payload: any) {
//     const user = await this.userRepo.findOne({ where: { id: payload.sub } });
//     if (!user) {
//       throw new UnauthorizedException();
//     }
//     return user; 
//   }
// }
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!, 
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
