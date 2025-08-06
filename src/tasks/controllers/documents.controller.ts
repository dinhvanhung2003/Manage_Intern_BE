// documents.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { DocumentsService } from '../services/documents.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateDocumentDto } from '../dtos/CreateDocumentDTO';
import {JwtAuthGuard} from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ReqUser } from '../../auth/req-user.decorators';
import { User } from '../../users/entities/user.entity';
import { successResponse, errorResponse } from '../../common/response';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

@Post('upload')
@UseInterceptors(FilesInterceptor('files', 10, {
  storage: diskStorage({
    destination: './uploads/documents',
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + '-' + file.originalname);
    },
  }),
}))
async uploadFiles(
  @UploadedFiles() files:any,
  @Body() dto: CreateDocumentDto,
  @ReqUser() user: any,
) {
  return this.documentsService.upload(dto, files, user);
}

@Patch(':id/approve')
async approveDoc(@Param('id', ParseIntPipe) id: number, @ReqUser() admin: User) {
  return this.documentsService.approve(id, admin);
}

@Patch(':id/reject')
async rejectDoc(@Param('id', ParseIntPipe) id: number) {
  return this.documentsService.reject(id);
}

  @Get('pending')
  async getPendingDocs() {
    return this.documentsService.findPending();
  }

// @Patch(':id/approve')
// async approveDoc(
//   @Param('id', ParseIntPipe) id: number,
//   @ReqUser() admin: User,
// ) {
//   return this.documentsService.approve(id, admin);
// }
  @Get('my')
async getMyDocuments(@ReqUser() user) {
  return this.documentsService.findByUploader(user.sub);
}


  @Get("all")
  async getAllDocuments() {
    return this.documentsService.findAll();
  }

 



}
