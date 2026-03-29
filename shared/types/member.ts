export type MemberRecord = {
  id: string
  companyId: string
  name: string
  nameKana: string | null
  role: string | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type MemberInput = {
  companyId: string
  name: string
  nameKana?: string
  role?: string
  note?: string
}