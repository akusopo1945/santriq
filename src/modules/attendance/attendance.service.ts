import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private notificationsService: NotificationsService,
  ) {}

  async markAttendance(
    classId: string,
    date: string,
    records: { studentId: string; status: AttendanceStatus; notes?: string }[],
    markedBy: string,
  ): Promise<Attendance[]> {
    const results: Attendance[] = [];
    for (const record of records) {
      // Cari jika data absen sudah ada
      let attendance = await this.attendanceRepository.findOne({
        where: { classId, studentId: record.studentId, date },
      });

      if (attendance) {
        attendance.status = record.status;
        attendance.notes = record.notes || null;
        attendance.markedById = markedBy;
      } else {
        attendance = this.attendanceRepository.create({
          classId,
          studentId: record.studentId,
          date,
          status: record.status,
          notes: record.notes || null,
          markedById: markedBy,
        });
      }
      const saved = await this.attendanceRepository.save(attendance);
      if (record.status === 'Hadir') {
        await this.usersService.addXp(record.studentId, 10);
      } else {
        // Status Sakit / Izin / Alfa: notify parents
        try {
          const student = await this.usersService.findOne(record.studentId);
          const cls = await this.classesService.findOne(classId);
          if (student && student.parents && student.parents.length > 0) {
            for (const parent of student.parents) {
              await this.notificationsService.createNotification(
                parent.id,
                'Laporan Absensi',
                `Santri ${student.fullname} dicatat "${record.status}" pada ${date} di kelas ${cls.name}${record.notes ? ` (${record.notes})` : ''}`,
                'absensi',
              );
            }
          }
        } catch (err) {
          console.error('Gagal mengirim notifikasi absensi ke wali murid:', err);
        }
      }
      results.push(saved);
    }
    return results;
  }

  async getAttendanceByClassAndDate(classId: string, date: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { classId, date },
      relations: { student: true },
    });
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { studentId },
      order: { date: 'DESC' },
    });
  }
}
