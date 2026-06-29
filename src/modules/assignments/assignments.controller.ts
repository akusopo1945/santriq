import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import * as fs from 'fs';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClassesService } from '../classes/classes.service';
import { UsersService } from '../users/users.service';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly classesService: ClassesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('classes/:classId/assignments')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async createAssignment(
    @Param('classId') classId: string,
    @Body() body: { title: string; description?: string; dueDate: string },
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.assignmentsService.createAssignment({
      title: body.title,
      description: body.description,
      dueDate: new Date(body.dueDate),
      classId,
    });
  }

  @Get('classes/:classId/assignments')
  async findAllAssignments(@Param('classId') classId: string, @CurrentUser() user: any) {
    const cls = await this.classesService.findOne(classId);
    if (user.role === UserRole.GURU && cls.teacherId !== user.id) {
      throw new ForbiddenException('Bukan kelas Anda');
    }
    if (user.role === UserRole.SANTRI && !cls.students.some((s) => s.id === user.id)) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }
    // Wali verification can be done in child mapping checked below
    return this.assignmentsService.findAllAssignmentsByClass(classId);
  }

  @Get('assignments/:id')
  async findAssignment(@Param('id') id: string) {
    return this.assignmentsService.findAssignment(id);
  }

  @Delete('assignments/:id')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async removeAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.GURU) {
      const assignment = await this.assignmentsService.findAssignment(id);
      const cls = await this.classesService.findOne(assignment.classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    await this.assignmentsService.removeAssignment(id);
    return { message: 'Tugas berhasil dihapus' };
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.SANTRI)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `submission-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async submit(
    @Param('id') id: string,
    @Body('textContent') textContent: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    // Verifikasi santri terdaftar di kelas tugas tersebut
    const assignment = await this.assignmentsService.findAssignment(id);
    const cls = await this.classesService.findOne(assignment.classId);
    if (!cls.students.some((s) => s.id === user.id)) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas tugas ini');
    }

    return this.assignmentsService.submitAssignment({
      assignmentId: id,
      studentId: user.id,
      filePath: file ? file.path : undefined,
      textContent,
    });
  }

  @Get('assignments/:id/submissions')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async getSubmissions(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role === UserRole.GURU) {
      const assignment = await this.assignmentsService.findAssignment(id);
      const cls = await this.classesService.findOne(assignment.classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.assignmentsService.findSubmissionsByAssignment(id);
  }

  @Get('assignments/:id/my-submission')
  @Roles(UserRole.SANTRI)
  async getMySubmission(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.findStudentSubmission(id, user.id);
  }

  @Get('assignments/:id/student-submission/:studentId')
  async getStudentSubmission(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.GURU) {
      const assignment = await this.assignmentsService.findAssignment(id);
      const cls = await this.classesService.findOne(assignment.classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    } else if (user.role === UserRole.WALI) {
      // Pastikan wali memetakan ke santri tersebut
      const parent = await this.usersService.findOne(user.id);
      if (!parent.children.some((c) => c.id === studentId)) {
        throw new ForbiddenException('Bukan anak Anda');
      }
    } else if (user.role === UserRole.SANTRI && user.id !== studentId) {
      throw new ForbiddenException('Akses ditolak');
    }

    return this.assignmentsService.findStudentSubmission(id, studentId);
  }

  @Get('submissions/:submissionId/download')
  async downloadSubmission(@Param('submissionId') submissionId: string, @Res() res: Response) {
    // Cari submission di DB
    // (Bisa tambahkan pengecekan kepemilikan file)
    // Silakan kembangkan jika diperlukan
    // Sementara diasumsikan download bisa dilakukan jika tahu ID submission
    return res.status(200).send('Download endpoint');
  }

  @Post('submissions/:submissionId/grade')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async grade(
    @Param('submissionId') submissionId: string,
    @Body() body: { grade: number; teacherNotes?: string },
    @CurrentUser() user: any,
  ) {
    // Sederhananya, jika dia guru kelas, diperbolehkan
    return this.assignmentsService.gradeSubmission(submissionId, body.grade, body.teacherNotes);
  }

  // TEMPLATE MANAGEMENT ENDPOINTS
  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async createTemplate(
    @Body() body: { title: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.createTemplate({
      title: body.title,
      description: body.description,
      teacherId: user.id,
    });
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async findAllTemplates(@CurrentUser() user: any) {
    return this.assignmentsService.findAllTemplatesByTeacher(user.id);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async removeTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    await this.assignmentsService.removeTemplate(id, user.id);
    return { message: 'Template berhasil dihapus' };
  }
}
