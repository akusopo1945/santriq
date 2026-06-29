import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum UmmiStatus {
  LULUS = 'Lulus',
  BELUM = 'Belum',
  PERBAIKAN = 'Perbaikan',
}

@Entity('ummi_progress')
export class UmmiProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  jilid: string; // e.g. "Jilid 1", "Jilid 2", ..., "Quran"

  @Column({ type: 'int' })
  page: number;

  @Column({
    type: 'enum',
    enum: UmmiStatus,
    default: UmmiStatus.BELUM,
  })
  status: UmmiStatus;

  @Column({ name: 'teacher_notes', nullable: true, type: 'text' })
  teacherNotes: string | null;

  @Column({ name: 'mistake_details', nullable: true, type: 'text' })
  mistakeDetails: string | null;

  @Column({ nullable: true, type: 'text' })
  recommendations: string | null;

  @Column({ name: 'target_page', nullable: true, type: 'int' })
  targetPage: number | null;

  @Column({ name: 'updated_by', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
