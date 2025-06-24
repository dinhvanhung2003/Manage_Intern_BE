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
} from '@nestjs/common';
import { Request } from 'express';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Controller()
export class CommonController {
  constructor(private readonly http: HttpService) {}

  @Get('universitys/vietnam')
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
}

