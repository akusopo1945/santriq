import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: { email?: string; password; fullname: string; role: UserRole }) {
    return this.usersService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GURU)
  findAll(
    @Query('role') role?: UserRole,
    @Query('scope') scope?: string,
    @CurrentUser() requester?: User,
  ) {
    return this.usersService.findAll(role, scope, requester);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() requester: User,
    @Body() body: { email?: string; password?: string; oldPassword?: string; fullname?: string; role?: UserRole },
  ) {
    if (requester.role !== UserRole.ADMIN && requester.id !== id) {
      throw new ForbiddenException('Hanya admin atau pemilik akun yang dapat memperbarui profil ini');
    }
    if (requester.role !== UserRole.ADMIN) {
      delete body.role;
    }
    return this.usersService.update(id, body, requester);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':parentId/children/:studentId')
  @Roles(UserRole.ADMIN)
  assignChild(@Param('parentId') parentId: string, @Param('studentId') studentId: string) {
    return this.usersService.assignChild(parentId, studentId);
  }

  @Get(':id/gamification')
  getGamification(@Param('id') id: string) {
    return this.usersService.getGamificationData(id);
  }

  @Post(':id/complete-stage')
  completeStage(@Param('id') id: string, @Body() body: { stage: number }) {
    return this.usersService.completeGameStage(id, body.stage);
  }

  @Post(':id/claim-streak')
  claimStreak(@Param('id') id: string) {
    return this.usersService.claimStreak(id);
  }

  @Post(':id/reports/generate')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  generateReport(@Param('id') id: string) {
    return this.usersService.generateWeeklyReport(id);
  }

  @Get(':id/reports')
  getReports(@Param('id') id: string) {
    return this.usersService.getWeeklyReports(id);
  }
}
