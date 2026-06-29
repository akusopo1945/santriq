import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/user.entity';
import { UmmiProgressModule } from '../ummi-progress/ummi-progress.module';

@Module({
  imports: [TypeOrmModule.forFeature([Class, User]), UmmiProgressModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
