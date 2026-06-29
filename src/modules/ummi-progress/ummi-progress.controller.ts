import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { UmmiProgressService } from './ummi-progress.service';
import { UmmiStatus } from './entities/ummi-progress.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('students/:studentId/ummi-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UmmiProgressController {
  constructor(
    private readonly ummiProgressService: UmmiProgressService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async create(
    @Param('studentId') studentId: string,
    @Body() body: { jilid: string; page: number; status: UmmiStatus; teacherNotes?: string; mistakeDetails?: string; recommendations?: string; targetPage?: number },
    @CurrentUser() user: any,
  ) {
    return this.ummiProgressService.createProgress({
      studentId,
      jilid: body.jilid,
      page: body.page,
      status: body.status,
      teacherNotes: body.teacherNotes,
      mistakeDetails: body.mistakeDetails,
      recommendations: body.recommendations,
      targetPage: body.targetPage,
      updatedBy: user.id,
    });
  }

  @Get('history')
  async getHistory(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    await this.verifyAccess(studentId, user);
    return this.ummiProgressService.getStudentHistory(studentId);
  }

  @Get('latest')
  async getLatest(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    await this.verifyAccess(studentId, user);
    return this.ummiProgressService.getLatestStudentProgress(studentId);
  }

  private async verifyAccess(studentId: string, user: any) {
    if (user.role === UserRole.SANTRI && user.id !== studentId) {
      throw new ForbiddenException('Akses ditolak');
    }
    if (user.role === UserRole.WALI) {
      const parent = await this.usersService.findOne(user.id);
      if (!parent.children.some((c) => c.id === studentId)) {
        throw new ForbiddenException('Bukan anak Anda');
      }
    }
  }
}
