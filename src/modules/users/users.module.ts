import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserBadge } from './entities/user-badge.entity';
import { WeeklyReport } from './entities/weekly-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBadge, WeeklyReport])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
