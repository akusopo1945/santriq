import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { UserBadge } from './entities/user-badge.entity';
import { WeeklyReport } from './entities/weekly-report.entity';
import { Class } from '../classes/entities/class.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBadge)
    private badgesRepository: Repository<UserBadge>,
    @InjectRepository(WeeklyReport)
    private weeklyReportsRepository: Repository<WeeklyReport>,
    private dataSource: DataSource,
  ) {}

  async create(data: { email?: string; password; fullname: string; role: UserRole }): Promise<User> {
    if (data.email) {
      const existing = await this.usersRepository.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictException('Email sudah terdaftar');
      }
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepository.create({
      email: data.email || null,
      passwordHash,
      fullname: data.fullname,
      role: data.role,
    });
    return this.usersRepository.save(user);
  }

  async findAll(role?: UserRole, scope?: string, requester?: User): Promise<User[]> {
    if (role === UserRole.SANTRI && requester && requester.role === UserRole.GURU && scope !== 'all') {
      const classes = await this.dataSource.getRepository(Class).find({
        where: { teacherId: requester.id },
        relations: { students: true },
      });
      const studentsMap = new Map<string, User>();
      for (const cls of classes) {
        for (const student of cls.students) {
          studentsMap.set(student.id, student);
        }
      }
      return Array.from(studentsMap.values());
    }
    if (role) {
      return this.usersRepository.find({ where: { role } });
    }
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { children: true, parents: true },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    data: { email?: string; password?: string; oldPassword?: string; fullname?: string; role?: UserRole },
    requester: User,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (data.email && data.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictException('Email sudah terdaftar');
      }
      user.email = data.email;
    }
    if (data.password) {
      if (requester.role !== UserRole.ADMIN) {
        if (!data.oldPassword) {
          throw new BadRequestException('Password lama wajib diisi untuk mengubah password baru');
        }
        const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
        if (!isMatch) {
          throw new BadRequestException('Password lama salah');
        }
      }
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.fullname) {
      user.fullname = data.fullname;
    }
    if (data.role && requester.role === UserRole.ADMIN) {
      user.role = data.role;
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async assignChild(parentId: string, studentId: string): Promise<void> {
    const parent = await this.usersRepository.findOne({
      where: { id: parentId, role: UserRole.WALI },
      relations: { children: true },
    });
    if (!parent) {
      throw new NotFoundException('Wali Santri tidak ditemukan');
    }
    const student = await this.usersRepository.findOne({
      where: { id: studentId, role: UserRole.SANTRI },
    });
    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan');
    }
    if (!parent.children.some((child) => child.id === student.id)) {
      parent.children.push(student);
      await this.usersRepository.save(parent);
    }
  }

  async addXp(studentId: string, amount: number): Promise<void> {
    const student = await this.usersRepository.findOne({
      where: { id: studentId, role: UserRole.SANTRI },
      relations: { badges: true }
    });
    if (!student) return;

    student.xp += amount;
    
    // Calculate new level
    let newLevel = 1;
    if (student.xp >= 1000) newLevel = 5;
    else if (student.xp >= 600) newLevel = 4;
    else if (student.xp >= 300) newLevel = 3;
    else if (student.xp >= 100) newLevel = 2;

    student.level = newLevel;

    // Check for streak updates
    const todayStr = new Date().toISOString().split('T')[0];
    if (student.lastActiveDate) {
      const lastActive = new Date(student.lastActiveDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        student.streak += 1;
      } else if (diffDays > 1) {
        student.streak = 1;
      }
    } else {
      student.streak = 1;
    }
    student.lastActiveDate = todayStr;

    await this.usersRepository.save(student);

    // Badge Check Logic
    await this.checkAndAwardBadges(student);
  }

  private async checkAndAwardBadges(student: User): Promise<void> {
    const existingNames = student.badges ? student.badges.map(b => b.badgeName) : [];

    const checkBadge = async (name: string, desc: string, icon: string, condition: boolean) => {
      if (condition && !existingNames.includes(name)) {
        const badge = this.badgesRepository.create({
          badgeName: name,
          description: desc,
          icon,
          studentId: student.id
        });
        await this.badgesRepository.save(badge);
      }
    };

    await checkBadge('Tugas Tepat Waktu', 'Berhasil mengumpulkan tugas mandiri.', 'award', student.xp >= 50);
    await checkBadge('Rajin Sholat', 'Istiqomah menjaga ibadah harian.', 'shield', student.xp >= 300);
    await checkBadge('Kehadiran Sempurna', 'Kehadiran tanpa alpa sepanjang pekan.', 'check-circle', student.xp >= 600);
    await checkBadge('Hafalan Lancar', 'Menyelesaikan target kelulusan jilid.', 'book-open', student.xp >= 1000);
  }

  async getGamificationData(studentId: string): Promise<any> {
    const student = await this.usersRepository.findOne({
      where: { id: studentId, role: UserRole.SANTRI },
      relations: { badges: true }
    });
    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan');
    }
    return {
      xp: student.xp,
      level: student.level,
      streak: student.streak,
      lastActiveDate: student.lastActiveDate,
      highestGameStage: student.highestGameStage,
      badges: student.badges || []
    };
  }

  async completeGameStage(studentId: string, stage: number): Promise<any> {
    const student = await this.findOne(studentId);
    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    let xpGained = 0;
    
    if (stage === student.highestGameStage && student.highestGameStage < 3) {
      student.highestGameStage = stage + 1;
      xpGained = 20; // +20 XP
      student.xp += xpGained;
      
      const levelTiers = [
        { level: 1, min: 0, max: 100 },
        { level: 2, min: 101, max: 300 },
        { level: 3, min: 301, max: 600 },
        { level: 4, min: 601, max: 1000 },
        { level: 5, min: 1001, max: Infinity }
      ];
      
      const newLvl = levelTiers.find(tier => student.xp >= tier.min && student.xp <= tier.max);
      if (newLvl && newLvl.level > student.level) {
        student.level = newLvl.level;
      }
    }

    await this.usersRepository.save(student);

    return {
      success: true,
      xpGained,
      xp: student.xp,
      level: student.level,
      highestGameStage: student.highestGameStage
    };
  }

  async generateWeeklyReport(studentId: string): Promise<WeeklyReport> {
    const student = await this.usersRepository.findOne({ where: { id: studentId, role: UserRole.SANTRI } });
    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimitStr = sevenDaysAgo.toISOString().split('T')[0];

    // 1. Get attendance rate
    const attendanceRecords = await this.dataSource.query(
      `SELECT status FROM attendance WHERE student_id = $1 AND date >= $2`,
      [studentId, dateLimitStr]
    );
    let attendanceRate = 100;
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter((r: any) => r.status === 'Hadir').length;
      attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);
    }

    // 2. Get assignments completed
    const submissionRecords = await this.dataSource.query(
      `SELECT id FROM submissions WHERE student_id = $1 AND submitted_at >= $2`,
      [studentId, sevenDaysAgo]
    );
    const assignmentsCompleted = submissionRecords.length;

    // 3. Get latest progress
    const progressRecords = await this.dataSource.query(
      `SELECT jilid, page, status, teacher_notes FROM ummi_progress WHERE student_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [studentId]
    );
    let progressSummary = 'Belum ada progres Ummi tercatat pekan ini.';
    if (progressRecords.length > 0) {
      const p = progressRecords[0];
      progressSummary = `Membaca ${p.jilid} Halaman ${p.page} dengan status ${p.status}. Catatan: ${p.teacher_notes || '-'}`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    let report = await this.weeklyReportsRepository.findOne({
      where: { studentId, reportDate: todayStr }
    });

    if (report) {
      report.attendanceRate = attendanceRate;
      report.assignmentsCompleted = assignmentsCompleted;
      report.progressSummary = progressSummary;
    } else {
      report = this.weeklyReportsRepository.create({
        studentId,
        reportDate: todayStr,
        attendanceRate,
        assignmentsCompleted,
        progressSummary,
      });
    }

    return this.weeklyReportsRepository.save(report);
  }

  async getWeeklyReports(studentId: string): Promise<WeeklyReport[]> {
    return this.weeklyReportsRepository.find({
      where: { studentId },
      order: { reportDate: 'DESC' }
    });
  }

  async claimStreak(studentId: string): Promise<any> {
    const student = await this.usersRepository.findOne({
      where: { id: studentId, role: UserRole.SANTRI },
      relations: { badges: true }
    });
    if (!student) throw new NotFoundException('Santri tidak ditemukan');

    const todayStr = new Date().toISOString().split('T')[0];
    if (student.lastActiveDate === todayStr) {
      return { message: 'Streak hari ini sudah diklaim', streak: student.streak, xp: student.xp };
    }

    await this.addXp(studentId, 5);
    const updated = await this.usersRepository.findOne({ where: { id: studentId } });
    if (!updated) throw new NotFoundException('Santri tidak ditemukan');
    return { message: 'Streak berhasil diklaim! +5 XP', streak: updated.streak, xp: updated.xp };
  }
}
