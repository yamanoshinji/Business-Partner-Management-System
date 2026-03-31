import { pgTable, uuid, text, date, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'

// 契約ステータスの enum 定義
export const contractStatusEnum = pgEnum('contract_status', [
  'NOT_STARTED',
  'ESTIMATE_REQUESTED',
  'ESTIMATE_RECEIVED',
  'DRAFT_CREATED',
  'DRAFT_CONFIRMED',
  'APPROVAL_CREATED',
  'CONTRACT_SENT',
  'CONTRACT_SIGNED',
  'CONTRACT_RECEIVED',
  'SENT_TO_MANAGEMENT',
  'COMPLETED',
])

// 企業テーブル（仕様書 §4.1）
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  homepage: text('homepage'),
  article36ExpiryDate: date('article36_expiry_date'),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 受入組織テーブル（初期データ取込用）
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  department: text('department').notNull(),
  group: text('group').notNull(),
  location: text('location').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 担当者テーブル（仕様書 §4.2）
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  employeeId: text('employee_id'),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  role: text('role'),
  hireDate: date('hire_date'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 契約テーブル（仕様書 §4.3）
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: contractStatusEnum('status').notNull().default('NOT_STARTED'),
  alertDate: date('alert_date'),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 通知テーブル（仕様書 §4.4）
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  triggeredAt: timestamp('triggered_at').notNull().defaultNow(),
})
