import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Assignment } from './assignment.entity';

@Entity('submissions')
@Unique(['assignmentId', 'studentId'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'file_path', type: 'varchar', nullable: true })
  filePath: string | null;

  @Column({ name: 'text_content', nullable: true, type: 'text' })
  textContent: string | null;

  @Column({ nullable: true, type: 'int' })
  grade: number | null;

  @Column({ name: 'teacher_notes', nullable: true, type: 'text' })
  teacherNotes: string | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamp with time zone' })
  submittedAt: Date;

  @Column({ name: 'graded_at', type: 'timestamp with time zone', nullable: true })
  gradedAt: Date | null;
}
