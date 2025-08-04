import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // Lấy accessToken từ cookie và set vào Authorization header
    const token = req.cookies?.accessToken;
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }

    return req;
  }
}
