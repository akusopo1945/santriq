import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { UserBadge } from './user-badge.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  GURU = 'GURU',
  SANTRI = 'SANTRI',
  WALI = 'WALI',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  fullname: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Gamification fields
  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ name: 'last_active_date', type: 'date', nullable: true })
  lastActiveDate: string | null;

  @OneToMany(() => UserBadge, (badge) => badge.student)
  badges: UserBadge[];

  // Wali Santri mapping: Wali can have multiple Santri children
  @ManyToMany(() => User, (user) => user.parents)
  @JoinTable({
    name: 'parents_mapping',
    joinColumn: { name: 'parent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  children: User[];

  @ManyToMany(() => User, (user) => user.children)
  parents: User[];

  @Column({ name: 'highest_game_stage', default: 1 })
  highestGameStage: number;
}
