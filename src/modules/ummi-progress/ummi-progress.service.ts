import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UmmiProgress, UmmiStatus } from './entities/ummi-progress.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UmmiProgressService {
  constructor(
    @InjectRepository(UmmiProgress)
    private ummiProgressRepository: Repository<UmmiProgress>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async createProgress(data: {
    studentId: string;
    jilid: string;
    page: number;
    status: UmmiStatus;
    teacherNotes?: string;
    mistakeDetails?: string;
    recommendations?: string;
    targetPage?: number;
    updatedBy: string;
  }): Promise<UmmiProgress> {
    const progress = this.miProgressRepositoryCreate(data);
    const saved = await this.ummiProgressRepository.save(progress);
    if (data.status === UmmiStatus.LULUS) {
      await this.usersService.addXp(data.studentId, 100);
    }

    // Trigger Notification
    try {
      const student = await this.usersService.findOne(data.studentId);
      const statusText = data.status === UmmiStatus.LULUS ? 'Lulus' : data.status === UmmiStatus.PERBAIKAN ? 'Perlu Perbaikan' : 'Belum Lulus';
      const msg = `Progres Ummi terbaru: ${data.jilid} Halaman ${data.page} - Status: ${statusText}`;

      // Notify Student
      await this.notificationsService.createNotification(
        data.studentId,
        'Progres Metode Ummi',
        msg,
        'progres',
      );

      // Notify Parents
      if (student && student.parents && student.parents.length > 0) {
        for (const parent of student.parents) {
          await this.notificationsService.createNotification(
            parent.id,
            'Progres Ummi Anak',
            `Progres Ummi santri ${student.fullname}: ${data.jilid} Halaman ${data.page} - Status: ${statusText}`,
            'progres',
          );
        }
      }
    } catch (err) {
      console.error('Gagal mengirim notifikasi progres Ummi:', err);
    }

    return saved;
  }

  private miProgressRepositoryCreate(data: {
    studentId: string;
    jilid: string;
    page: number;
    status: UmmiStatus;
    teacherNotes?: string;
    mistakeDetails?: string;
    recommendations?: string;
    targetPage?: number;
    updatedBy: string;
  }) {
    return this.ummiProgressRepository.create({
      studentId: data.studentId,
      jilid: data.jilid,
      page: data.page,
      status: data.status,
      teacherNotes: data.teacherNotes || null,
      mistakeDetails: data.mistakeDetails || null,
      recommendations: data.recommendations || null,
      targetPage: data.targetPage || null,
      updatedById: data.updatedBy,
    });
  }

  async getStudentHistory(studentId: string): Promise<UmmiProgress[]> {
    return this.ummiProgressRepository.find({
      where: { studentId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getLatestStudentProgress(studentId: string): Promise<UmmiProgress | null> {
    return this.ummiProgressRepository.findOne({
      where: { studentId },
      order: { updatedAt: 'DESC' },
    });
  }
}
