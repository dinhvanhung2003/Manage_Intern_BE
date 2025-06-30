import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  Param,
  BadRequestException,
  Post
} from '@nestjs/common';
import { Request } from 'express';
import { InternsService } from './interns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateInternDto } from './dto/UpdateInternDTO';
import { TaskStatus } from '../tasks/entities/task.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskImageMulterOptions } from '../configs/multer.config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ReqUser } from '../auth/req-user.decorators';
import { User } from '../users/user.entity';
import { ParseIntPipe } from '@nestjs/common/pipes/parse-int.pipe';
import { Task } from '../tasks/entities/task.entity';
@Controller('interns')
@UseGuards(JwtAuthGuard)
export class InternsController {
  constructor(
    private readonly internsService: InternsService,
    private readonly http: HttpService,
  ) { }

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.internsService.getProfile(user.sub);
  }

  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() body: UpdateInternDto) {
    const user = req.user as { sub: number };
    return this.internsService.updateProfile(user.sub, body);
  }

  @Get('vietnam')
  async getVietnamUniversities() {
    const url =
      'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json';

    const response: AxiosResponse<any[]> = await firstValueFrom(this.http.get(url));
    const vietnamUnis = response.data.filter(
      (u) => u.country?.toLowerCase().includes('vietnam'),
    );

    return vietnamUnis.map((u) => ({
      name: u.name,
      website: u.web_pages?.[0] || '',
      domain: u.domains?.[0] || '',
    }));
  }

  @Get('tasks')
  async getMyTasks(@Req() req: Request) {
    const internId = (req.user as any).sub;
    const search = (req.query.search as string) || '';
    return this.internsService.findTasksByIntern(internId, search);
  }


  @Patch('tasks/:id/accept')
  async acceptTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body('note') note: string,
  ) {
    const internId = (req.user as any).sub;
    return this.internsService.updateStatus(id, internId, TaskStatus.IN_PROGRESS, undefined, undefined, note);
  }


  @Get('assignment')
  async getAssignment(@Req() req: Request) {
    const internId = (req.user as any).sub;
    return this.internsService.getAssignment(internId);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('file', {
    dest: './uploads/avatars' // lưu tạm
  }))
  async uploadAvatar(
    @UploadedFile() file: any,
    @Req() req: Request
  ) {
    const user = req.user as { sub: number };

    if (!user?.sub || !file) {
      throw new BadRequestException('Thiếu file hoặc user');
    }

    return this.internsService.updateAvatar(user.sub, file);
  }

  // gui file bao cao 
  @Patch('tasks/:id/submit')
  @UseInterceptors(FileInterceptor('file', taskImageMulterOptions))
  async updateTaskStatus(
    @Param('id') taskId: number,
    @UploadedFile() file: any,
    @Body('submittedText') submittedText: string,
    @Body('note') note: string,
    @ReqUser() user: any,
  ) {
    return this.internsService.updateStatus(
      taskId,
      user.sub,
      TaskStatus.COMPLETED,
      submittedText,
      file,
      note, // 
    );
  }





}
