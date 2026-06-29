import { Controller, Get, Post, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from './entities/attendance.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClassesService } from '../classes/classes.service';
import { UsersService } from '../users/users.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly classesService: ClassesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('classes/:classId/attendance')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async mark(
    @Param('classId') classId: string,
    @Body() body: { date: string; records: { studentId: string; status: AttendanceStatus; notes?: string }[] },
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.attendanceService.markAttendance(classId, body.date, body.records, user.id);
  }

  @Get('classes/:classId/attendance')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async getByClass(
    @Param('classId') classId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.GURU) {
      const cls = await this.classesService.findOne(classId);
      if (cls.teacherId !== user.id) {
        throw new ForbiddenException('Bukan kelas Anda');
      }
    }
    return this.attendanceService.getAttendanceByClassAndDate(classId, date);
  }

  @Get('students/:studentId/attendance')
  async getByStudent(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.SANTRI && user.id !== studentId) {
      throw new ForbiddenException('Akses ditolak');
    }
    if (user.role === UserRole.WALI) {
      const parent = await this.usersService.findOne(user.id);
      if (!parent.children.some((c) => c.id === studentId)) {
        throw new ForbiddenException('Bukan anak Anda');
      }
    }
    return this.attendanceService.getAttendanceByStudent(studentId);
  }
}
