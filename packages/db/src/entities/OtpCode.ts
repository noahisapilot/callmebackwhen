import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  @Index()
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
