import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Assignment } from './entities/assignment.entity';
import { Submission } from './entities/submission.entity';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { NotificationsService } from '../notifications/notifications.service';

import { AssignmentTemplate } from './entities/assignment-template.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(AssignmentTemplate)
    private templatesRepository: Repository<AssignmentTemplate>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private notificationsService: NotificationsService,
  ) {}

  // ASSIGNMENTS MANAGEMENT
  async createAssignment(data: {
    title: string;
    description?: string;
    dueDate: Date;
    classId: string;
  }): Promise<Assignment> {
    const assignment = this.assignmentsRepository.create({
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate,
      classId: data.classId,
    });
    const saved = await this.assignmentsRepository.save(assignment);

    try {
      const cls = await this.classesService.findOne(data.classId);
      if (cls && cls.students && cls.students.length > 0) {
        for (const student of cls.students) {
          await this.notificationsService.createNotification(
            student.id,
            'Tugas Baru',
            `Tugas baru diposting di kelas ${cls.name}: "${data.title}"`,
            'tugas',
          );
        }
      }
    } catch (err) {
      console.error('Failed to send notification for new assignment:', err);
    }

    return saved;
  }

  async findAllAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return this.assignmentsRepository.find({
      where: { classId },
      order: { dueDate: 'ASC' },
    });
  }

  async findAssignment(id: string): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: { class: true },
    });
    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }
    return assignment;
  }

  async removeAssignment(id: string): Promise<void> {
    const assignment = await this.findAssignment(id);
    await this.assignmentsRepository.remove(assignment);
  }

  // SUBMISSIONS MANAGEMENT
  async submitAssignment(data: {
    assignmentId: string;
    studentId: string;
    filePath?: string;
    textContent?: string;
  }): Promise<Submission> {
    // Cari apakah tugas ada
    const assignment = await this.findAssignment(data.assignmentId);
    const student = await this.usersService.findOne(data.studentId);

    // Cek jika sudah pernah mengumpulkan
    let submission = await this.submissionsRepository.findOne({
      where: { assignmentId: data.assignmentId, studentId: data.studentId },
    });

    if (submission) {
      // Hapus file lama jika ada pengunggahan file baru
      if (data.filePath && submission.filePath && fs.existsSync(submission.filePath)) {
        try {
          await fs.promises.unlink(submission.filePath);
        } catch (err) {
          console.error(`Gagal menghapus file lama: ${submission.filePath}`, err);
        }
      }

      submission.filePath = data.filePath || submission.filePath;
      submission.textContent = data.textContent || submission.textContent;
      submission.submittedAt = new Date();
      // Reset penilaian jika dikumpulkan kembali
      submission.grade = null;
      submission.teacherNotes = null;
      submission.gradedAt = null;
    } else {
      submission = this.submissionsRepository.create({
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        filePath: data.filePath || null,
        textContent: data.textContent || null,
      });
    }
    const saved = await this.submissionsRepository.save(submission);
    await this.usersService.addXp(data.studentId, 50);

    // Kirim notifikasi ke guru
    try {
      if (assignment.class && assignment.class.teacherId) {
        await this.notificationsService.createNotification(
          assignment.class.teacherId,
          'Tugas Dikumpulkan',
          `Santri ${student.fullname} mengumpulkan tugas "${assignment.title}"`,
          'tugas',
        );
      }
    } catch (err) {
      console.error('Gagal mengirim notifikasi tugas dikumpulkan ke guru:', err);
    }

    return saved;
  }

  async gradeSubmission(
    submissionId: string,
    grade: number,
    teacherNotes?: string,
  ): Promise<Submission> {
    if (grade < 0 || grade > 100) {
      throw new BadRequestException('Nilai harus di antara 0 sampai 100');
    }
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: { student: { parents: true }, assignment: { class: true } },
    });
    if (!submission) {
      throw new NotFoundException('Pengumpulan tugas tidak ditemukan');
    }
    submission.grade = grade;
    submission.teacherNotes = teacherNotes || null;
    submission.gradedAt = new Date();
    const saved = await this.submissionsRepository.save(submission);

    // Kirim notifikasi penilaian
    try {
      await this.notificationsService.createNotification(
        submission.studentId,
        'Tugas Dinilai',
        `Tugas "${submission.assignment.title}" telah dinilai: ${grade}`,
        'nilai',
      );

      if (submission.student && submission.student.parents) {
        for (const parent of submission.student.parents) {
          await this.notificationsService.createNotification(
            parent.id,
            'Nilai Tugas Anak',
            `Tugas "${submission.assignment.title}" untuk santri ${submission.student.fullname} telah dinilai: ${grade}`,
            'nilai',
          );
        }
      }
    } catch (err) {
      console.error('Gagal mengirim notifikasi penilaian tugas:', err);
    }

    return saved;
  }

  async findSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { assignmentId },
      relations: { student: true },
      order: { submittedAt: 'DESC' },
    });
  }

  async findStudentSubmission(assignmentId: string, studentId: string): Promise<Submission | null> {
    return this.submissionsRepository.findOne({
      where: { assignmentId, studentId },
    });
  }

  // TEMPLATES CRUD
  async createTemplate(data: { title: string; description?: string; teacherId: string }): Promise<AssignmentTemplate> {
    const template = this.templatesRepository.create({
      title: data.title,
      description: data.description || null,
      teacherId: data.teacherId,
    });
    return this.templatesRepository.save(template);
  }

  async findAllTemplatesByTeacher(teacherId: string): Promise<AssignmentTemplate[]> {
    return this.templatesRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeTemplate(id: string, teacherId: string): Promise<void> {
    const template = await this.templatesRepository.findOne({ where: { id, teacherId } });
    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    }
    await this.templatesRepository.remove(template);
  }
}
