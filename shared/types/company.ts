export type CompanyRecord = {
  id: string
  name: string
  nameKana: string | null
  homepage: string | null
  article36ExpiryDate: string | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type CompanyInput = {
  name: string
  nameKana?: string
  homepage?: string
  article36ExpiryDate?: string
  note?: string
}