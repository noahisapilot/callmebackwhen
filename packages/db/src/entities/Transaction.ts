import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';
import { Call } from './Call.js';

export type TransactionType = 'topup' | 'call_charge' | 'refund';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents!: number;

  @Column({ name: 'balance_after_cents', type: 'integer' })
  balanceAfterCents!: number;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 100, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ name: 'call_id', type: 'uuid', nullable: true })
  callId!: string | null;

  @ManyToOne(() => Call, { nullable: true })
  @JoinColumn({ name: 'call_id' })
  call!: Call | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
