import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

export type CallStatus =
  | 'pending'
  | 'dialing'
  | 'in_ivr'
  | 'on_hold'
  | 'with_rep'
  | 'transferring'
  | 'completed'
  | 'failed';

export type CallOutcome =
  | 'resolved_auto'
  | 'resolved_transfer'
  | 'failed'
  | 'cancelled';

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'target_phone_number', type: 'varchar', length: 20 })
  targetPhoneNumber!: string;

  @Column({ name: 'user_prompt', type: 'text' })
  userPrompt!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status!: CallStatus;

  @Column({ name: 'vapi_call_id', type: 'varchar', length: 100, nullable: true })
  vapiCallId!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'connected_at', type: 'timestamptz', nullable: true })
  connectedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds!: number | null;

  @Column({ name: 'hold_duration_seconds', type: 'integer', nullable: true })
  holdDurationSeconds!: number | null;

  @Column({ name: 'cost_cents', type: 'integer', nullable: true })
  costCents!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  outcome!: CallOutcome | null;

  @Column({ name: 'outcome_summary', type: 'text', nullable: true })
  outcomeSummary!: string | null;

  @Column({ name: 'recording_url', type: 'text', nullable: true })
  recordingUrl!: string | null;

  @Column({ name: 'transcript_url', type: 'text', nullable: true })
  transcriptUrl!: string | null;

  @Column({ name: 'expected_wait_minutes', type: 'integer', nullable: true })
  expectedWaitMinutes!: number | null;

  @Column({ name: 'callback_requested', type: 'boolean', default: false })
  callbackRequested!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
