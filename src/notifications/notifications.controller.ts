import { Controller, Get, UseGuards, Req, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req) {
    return this.service.getByUser(req.user.sub);
  }

  @Patch('read-all')
  async markAllRead(@Req() req) {
    await this.service.markAllAsRead(req.user.sub);
    return { message: 'Đã đánh dấu tất cả là đã đọc' };
  }
}
