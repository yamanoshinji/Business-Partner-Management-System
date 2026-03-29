<script setup lang="ts">
import type { ContractStatus } from '../../../shared/types/contract'

type Member = {
  id: string
  companyId: string
  name: string
  nameKana: string | null
  role: string | null
  note: string | null
}

type Company = {
  id: string
  name: string
}

type Contract = {
  id: string
  memberId: string
  startDate: string
  endDate: string
  status: ContractStatus
  alertDate: string | null
  note: string | null
}

const route = useRoute()
const memberId = route.params.id as string

const { data: member, error: memberError, refresh: refreshMember } = await useFetch<Member>(`/api/members/${memberId}`)
const { data: companies } = await useFetch<Company[]>('/api/companies')
const { data: contracts, error: contractsError, refresh: refreshContracts } = await useFetch<Contract[]>(`/api/contracts?memberId=${memberId}`)

const companyName = computed(() => companies.value?.find(company => company.id === member.value?.companyId)?.name ?? '-')
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <VBtn variant="text" class="mb-4" to="/members">担当者一覧へ戻る</VBtn>

      <VAlert v-if="memberError" type="error" variant="tonal" class="mb-4">担当者情報の取得に失敗しました。</VAlert>

      <VCard v-if="member" class="mb-6">
        <VCardTitle>{{ member.name }}</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6"><strong>所属企業:</strong> {{ companyName }}</VCol>
            <VCol cols="12" md="6"><strong>氏名カナ:</strong> {{ member.nameKana || '-' }}</VCol>
            <VCol cols="12" md="6"><strong>役割:</strong> {{ member.role || '-' }}</VCol>
            <VCol cols="12"><strong>備考:</strong> {{ member.note || '-' }}</VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VBtn variant="text" @click="refreshMember">更新</VBtn>
        </VCardActions>
      </VCard>

      <VCard>
        <VCardTitle>契約履歴</VCardTitle>
        <VCardText>
          <VAlert v-if="contractsError" type="error" variant="tonal">契約一覧の取得に失敗しました。</VAlert>
          <VTable v-else>
            <thead>
              <tr>
                <th>契約開始日</th>
                <th>契約終了日</th>
                <th>アラート日</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contract in contracts ?? []" :key="contract.id">
                <td>{{ contract.startDate }}</td>
                <td>{{ contract.endDate }}</td>
                <td>{{ contract.alertDate || '-' }}</td>
                <td><StatusChip :status="contract.status" /></td>
              </tr>
              <tr v-if="(contracts ?? []).length === 0">
                <td colspan="4" class="text-center py-6">契約はまだ登録されていません</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
        <VCardActions>
          <VBtn variant="text" @click="refreshContracts">再読み込み</VBtn>
        </VCardActions>
      </VCard>
    </VContainer>
  </AppShell>
</template>