import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentFile } from './entities/document-file';
import { CreateDocumentDto } from './dtos/CreateDocumentDTO';
import { User } from '../users/user.entity';
import { DocumentStatus } from './entities/constants/document-status';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { DocumentType } from './entities/constants/document-type';
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepo: Repository<Document>,

    @InjectRepository(DocumentFile)
    private documentFileRepo: Repository<DocumentFile>,
    
  ) {}

async upload(dto: CreateDocumentDto, files: any[], user: any): Promise<Document> {
  if (!dto.type) throw new BadRequestException('Missing type');
  console.log('DTO TYPE:', dto.type);
  console.log('FILES:', files);
  console.log('USER:', user);
  const document = this.documentRepo.create({
    title: dto.title,
    description: dto.description,
  uploadedBy: { id: user.id},

    status: DocumentStatus.PENDING,
    type: dto.type,
  });
console.log('🔍 Current User:', user);
  console.log('Document to be saved:', document);

  const savedDocument = await this.documentRepo.save(document);
  console.log('Saved Document:', savedDocument);

  if (!files || files.length === 0) return savedDocument;

  const documentFiles = files
    .filter((file) => !!file.filename)
    .map((file, i) => {
      const fileUrl = `uploads/documents/${file.filename}`;
      const fileType = dto.type as DocumentType;

      console.log(`Creating DocumentFile ${i}:`, { fileUrl, type: fileType });

      return {
        fileUrl,
        type: fileType,
        document: savedDocument,
      };
    });

  if (documentFiles.length === 0) {
    console.warn('Không có file hợp lệ để lưu');
  } else {
    await this.documentFileRepo.insert(documentFiles);
    const savedFiles = await this.documentFileRepo.find({
      where: { document: { id: savedDocument.id } },
    });
    savedDocument.files = savedFiles;
  }

  return savedDocument;
}






  async findPending() {
    return this.documentRepo.find({
      where: { status: DocumentStatus.PENDING },
      relations: ['uploadedBy', 'files'],
    });
  }

  async findAll() {
    return this.documentRepo.find({
      relations: ['uploadedBy', 'approvedBy', 'files'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async approve(id: number, admin: User) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');

    doc.status = DocumentStatus.APPROVED;
    doc.approvedBy = admin;
    doc.approvedAt = new Date();

    return this.documentRepo.save(doc);
  }

  async reject(id: number) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');

    doc.status = DocumentStatus.REJECTED;
    doc.approvedBy = null;
    doc.approvedAt = null;

    return this.documentRepo.save(doc);
  }

 async findByUploader(userId: number) {
  console.log('Finding documents for user ID:', userId);
  return this.documentRepo.find({
    where: { uploadedBy: { id: userId } }, 
    relations: ['uploadedBy', 'approvedBy', 'files'],
    order: { uploadedAt: 'DESC' },
  });
}

}
