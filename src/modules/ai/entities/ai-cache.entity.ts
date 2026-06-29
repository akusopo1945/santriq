import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ai_cache')
export class AiCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  promptHash: string;

  @Column({ type: 'text' })
  response: string;

  @CreateDateColumn()
  createdAt: Date;
}
