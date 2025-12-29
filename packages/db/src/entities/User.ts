import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, unique: true })
  @Index()
  phoneNumber!: string;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ name: 'balance_cents', type: 'integer', default: 0 })
  balanceCents!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
