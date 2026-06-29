import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'badge_name' })
  badgeName: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamp with time zone' })
  unlockedAt: Date;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, (user) => user.badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;
}
