import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UmmiProgressService } from './ummi-progress.service';
import { UmmiProgressController } from './ummi-progress.controller';
import { UmmiProgress } from './entities/ummi-progress.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([UmmiProgress]), UsersModule, NotificationsModule],
  controllers: [UmmiProgressController],
  providers: [UmmiProgressService],
  exports: [UmmiProgressService],
})
export class UmmiProgressModule {}
