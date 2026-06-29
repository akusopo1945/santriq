import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import type { Response } from 'express';
import * as fs from 'fs';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSettings(
    @Body()
    body: {
      institutionName?: string;
      logoUrl?: string;
      address?: string;
      phone?: string;
    },
  ) {
    return this.settingsService.updateSettings(body);
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for logo
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('File logo tidak ditemukan');
    }
    const logoUrl = `/api/system-settings/logo/${file.filename}`;
    await this.settingsService.updateSettings({ logoUrl });
    return { logoUrl };
  }

  @Get('logo/:filename')
  async getLogo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = resolve(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File logo tidak ditemukan di server');
    }
    res.sendFile(filePath);
  }
}
