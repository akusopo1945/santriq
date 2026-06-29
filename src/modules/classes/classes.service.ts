import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(name: string, teacherId: string): Promise<Class> {
    const teacher = await this.usersRepository.findOne({ where: { id: teacherId, role: UserRole.GURU } });
    if (!teacher) {
      throw new NotFoundException('Guru tidak ditemukan');
    }
    const cls = this.classesRepository.create({ name, teacherId });
    return this.classesRepository.save(cls);
  }

  async findAll(teacherId?: string, studentId?: string): Promise<Class[]> {
    const query = this.classesRepository.createQueryBuilder('class')
      .leftJoinAndSelect('class.teacher', 'teacher');

    if (teacherId) {
      query.andWhere('class.teacher_id = :teacherId', { teacherId });
    }

    if (studentId) {
      query.innerJoin('class.students', 'student', 'student.id = :studentId', { studentId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Class> {
    const cls = await this.classesRepository.findOne({
      where: { id },
      relations: { teacher: true, students: true },
    });
    if (!cls) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }
    return cls;
  }

  async remove(id: string): Promise<void> {
    const cls = await this.findOne(id);
    await this.classesRepository.remove(cls);
  }

  async addStudent(classId: string, studentId: string): Promise<Class> {
    const cls = await this.classesRepository.findOne({
      where: { id: classId },
      relations: { students: true },
    });
    if (!cls) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }
    const student = await this.usersRepository.findOne({ where: { id: studentId, role: UserRole.SANTRI } });
    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan');
    }
    if (!cls.students.some((s) => s.id === studentId)) {
      cls.students.push(student);
      await this.classesRepository.save(cls);
    }
    return cls;
  }

  async removeStudent(classId: string, studentId: string): Promise<Class> {
    const cls = await this.classesRepository.findOne({
      where: { id: classId },
      relations: { students: true },
    });
    if (!cls) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }
    cls.students = cls.students.filter((s) => s.id !== studentId);
    return this.classesRepository.save(cls);
  }
}
