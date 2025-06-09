import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { InternsService } from './interns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { UpdateInternDto } from './dto/UpdateInternDTO';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
@Controller('interns')
@UseGuards(JwtAuthGuard)
export class InternsController {
  constructor(private readonly internsService: InternsService,
     private readonly http: HttpService,
  ) {}

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

  const response: AxiosResponse<any[]> = await firstValueFrom(
    this.http.get<any[]>(url),
  );

  const vietnamUnis = response.data.filter(
    (u) => u.country?.toLowerCase().includes('vietnam'),
  );

  console.log('Vietnam universities:', vietnamUnis.length);

  return vietnamUnis.map((u) => ({
    name: u.name,
    website: u.web_pages?.[0] || '',
    domain: u.domains?.[0] || '',
  }));
}

}
