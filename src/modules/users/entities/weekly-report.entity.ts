import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('weekly_reports')
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: string;

  @Column({ name: 'attendance_rate', type: 'int' })
  attendanceRate: number;

  @Column({ name: 'progress_summary', type: 'text' })
  progressSummary: string;

  @Column({ name: 'assignments_completed', type: 'int' })
  assignmentsCompleted: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
