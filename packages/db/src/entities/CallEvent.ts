import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Call } from './Call.js';

export type CallEventType =
  | 'call_started'
  | 'ivr_detected'
  | 'hold_started'
  | 'hold_ended'
  | 'callback_offered'
  | 'callback_accepted'
  | 'rep_available'
  | 'transfer_initiated'
  | 'transfer_completed'
  | 'info_requested'
  | 'info_received'
  | 'speech_update'
  | 'resolved'
  | 'error';

@Entity('call_events')
export class CallEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'call_id', type: 'uuid' })
  @Index()
  callId!: string;

  @ManyToOne(() => Call)
  @JoinColumn({ name: 'call_id' })
  call!: Call;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType!: CallEventType;

  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
