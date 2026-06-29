import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UmmiProgressService } from '../ummi-progress/ummi-progress.service';
import { UmmiStatus } from '../ummi-progress/entities/ummi-progress.entity';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly ummiProgressService: UmmiProgressService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: { name: string; teacherId: string }) {
    return this.classesService.create(body.name, body.teacherId);
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('teacherId') teacherId?: string, @Query('studentId') studentId?: string) {
    // If not Admin, enforce scoped visibility
    if (user.role === UserRole.GURU) {
      return this.classesService.findAll(user.id, undefined);
    }
    if (user.role === UserRole.SANTRI) {
      return this.classesService.findAll(undefined, user.id);
    }
    if (user.role === UserRole.WALI) {
      // Wali Santri can see classes of their children, let's allow querying by studentId if student is child of wali
      if (!studentId) {
        throw new ForbiddenException('Harus menentukan studentId untuk Wali Santri');
      }
      return this.classesService.findAll(undefined, studentId);
    }
    return this.classesService.findAll(teacherId, studentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const cls = await this.classesService.findOne(id);
    // RBAC checks for specific Class
    if (user.role === UserRole.GURU && cls.teacherId !== user.id) {
      throw new ForbiddenException('Bukan kelas Anda');
    }
    if (user.role === UserRole.SANTRI && !cls.students.some((s) => s.id === user.id)) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }
    return cls;
  }

  @Post(':id/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async addStudent(@Param('id') id: string, @Param('studentId') studentId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(id);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.classesService.addStudent(id, studentId);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(id);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.classesService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Post(':id/bulk-progress')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async bulkProgress(
    @Param('id') id: string,
    @Body('records') records: {
      studentId: string;
      jilid: string;
      page: number;
      status: UmmiStatus;
      teacherNotes?: string;
      mistakeDetails?: string;
      recommendations?: string;
      targetPage?: number;
    }[],
    @CurrentUser() user: any,
  ) {
    const cls = await this.classesService.findOne(id);
    if (user.role === UserRole.GURU && cls.teacherId !== user.id) {
      throw new ForbiddenException('Bukan kelas Anda');
    }

    const results: any[] = [];
    for (const record of records) {
      const newProg = await this.ummiProgressService.createProgress({
        studentId: record.studentId,
        jilid: record.jilid,
        page: record.page,
        status: record.status,
        teacherNotes: record.teacherNotes,
        mistakeDetails: record.mistakeDetails,
        recommendations: record.recommendations,
        targetPage: record.targetPage,
        updatedBy: user.id,
      });
      results.push(newProg);
    }
    return results;
  }

  @Post(':id/copy-progress')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async copyProgress(@Param('id') id: string, @CurrentUser() user: any) {
    const cls = await this.classesService.findOne(id);
    if (user.role === UserRole.GURU && cls.teacherId !== user.id) {
      throw new ForbiddenException('Bukan kelas Anda');
    }

    const copied: any[] = [];
    for (const student of cls.students) {
      const latest = await this.ummiProgressService.getLatestStudentProgress(student.id);
      if (latest) {
        const newProg = await this.ummiProgressService.createProgress({
          studentId: student.id,
          jilid: latest.jilid,
          page: latest.page,
          status: latest.status,
          teacherNotes: latest.teacherNotes || undefined,
          mistakeDetails: latest.mistakeDetails || undefined,
          recommendations: latest.recommendations || undefined,
          targetPage: latest.targetPage || undefined,
          updatedBy: user.id,
        });
        copied.push(newProg);
      }
    }
    return copied;
  }
}
