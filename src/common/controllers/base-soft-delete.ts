import {
  Delete,
  Patch,
  Get,
  Param,
  Body,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';

export class BaseSoftDeleteController<T> {
  constructor(private readonly service: any) {}

  @Delete('bulk')
  softDeleteMany(@Body() body: { ids: number[] }) {
    return this.service.softDeleteMany(body.ids);
  }

  @Patch('bulk/restore')
  restoreMany(@Body() body: { ids: number[] }) {
    return this.service.restoreMany(body.ids);
  }

  @Delete(':id')
  softDeleteOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDeleteOne(id);
  }

  @Patch(':id/restore')
  restoreOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.restoreOne(id);
  }

  @Get('deleted')
  getDeleted() {
    return this.service.findDeleted();
  }

  @Get()
  getActive() {
    return this.service.findActive();
  }
}
