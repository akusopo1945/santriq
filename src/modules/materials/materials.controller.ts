import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ForbiddenException,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import * as fs from 'fs';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClassesService } from '../classes/classes.service';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Pastikan directory upload ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly classesService: ClassesService,
  ) {}

  @Post('classes/:classId/materials')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit sesuai PRD
    }),
  )
  async upload(
    @Param('classId') classId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('tags') tags: string,
    @Body('folderPath') folderPath: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    // Verifikasi kelas milik guru ybs (jika role Guru)
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }

    if (!file) {
      throw new ForbiddenException('File wajib diupload');
    }

    return this.materialsService.create({
      title: title || file.originalname,
      description,
      filePath: file.path,
      fileSize: file.size,
      uploaderId: user.id,
      classId,
      tags,
      folderPath,
    });
  }

  @Get('classes/:classId/materials')
  async findAll(
    @Param('classId') classId: string,
    @Query('search') search: string,
    @Query('folderPath') folderPath: string,
    @CurrentUser() user: any,
  ) {
    const cls = await this.classesService.findOne(classId);
    // RBAC check
    if (user.role === UserRole.GURU && cls.teacherId !== user.id) {
      throw new ForbiddenException('Bukan kelas Anda');
    }
    if (user.role === UserRole.SANTRI && !cls.students.some((s) => s.id === user.id)) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }
    // Wali Santri can see child's materials, checked in UI level / class validation
    return this.materialsService.findAllByClass(classId, { search, folderPath });
  }

  @Get('materials/:id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const material = await this.materialsService.findOne(id);
    if (!fs.existsSync(material.filePath)) {
      throw new NotFoundException('File fisik tidak ditemukan di server');
    }
    res.download(material.filePath, material.title + extname(material.filePath));
  }

  @Delete('materials/:id')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const material = await this.materialsService.findOne(id);
    if (user.role === UserRole.GURU && material.uploaderId !== user.id) {
      throw new ForbiddenException('Anda bukan pengunggah materi ini');
    }
    await this.materialsService.remove(id);
    return { message: 'Materi berhasil dihapus' };
  }
}
