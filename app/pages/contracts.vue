<script setup lang="ts">
import { CONTRACT_STATUS, type ContractStatus } from '../../shared/types/contract'

type Company = {
  id: string
  name: string
}

type Member = {
  id: string
  companyId: string
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

type ContractForm = {
  memberId: string
  startDate: string
  endDate: string
  note: string
}

const { data: companies } = await useFetch<Company[]>('/api/companies')
const { data: members } = await useFetch<Member[]>('/api/members')
const { data, refresh, error, status } = await useFetch<Contract[]>('/api/contracts')

const dialog = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const editingId = ref<string | null>(null)
const form = reactive<ContractForm>({
  memberId: '',
  startDate: '',
  endDate: '',
  note: '',
})

const companyNameMap = computed(() => new Map((companies.value ?? []).map(company => [company.id, company.name])))
const memberLabelMap = computed(() => new Map((members.value ?? []).map(member => [member.id, `${member.name} / ${companyNameMap.value.get(member.companyId) ?? '企業未設定'}`])))

function resetForm(): void {
  editingId.value = null
  errorMessage.value = ''
  form.memberId = ''
  form.startDate = ''
  form.endDate = ''
  form.note = ''
}

function openCreateDialog(): void {
  resetForm()
  form.memberId = members.value?.[0]?.id ?? ''
  dialog.value = true
}

function openEditDialog(contract: Contract): void {
  editingId.value = contract.id
  errorMessage.value = ''
  form.memberId = contract.memberId
  form.startDate = contract.startDate
  form.endDate = contract.endDate
  form.note = contract.note ?? ''
  dialog.value = true
}

async function submitForm(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      memberId: form.memberId,
      startDate: form.startDate,
      endDate: form.endDate,
      note: form.note,
    }

    if (editingId.value) {
      await $fetch(`/api/contracts/${editingId.value}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/contracts', { method: 'POST', body: payload })
    }

    dialog.value = false
    resetForm()
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '契約の保存に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

async function moveStatus(contract: Contract, direction: 'next' | 'prev'): Promise<void> {
  const currentIndex = CONTRACT_STATUS.indexOf(contract.status)
  const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1

  if (nextIndex < 0 || nextIndex >= CONTRACT_STATUS.length) {
    return
  }

  const nextStatus = CONTRACT_STATUS[nextIndex]

  try {
    await $fetch(`/api/contracts/${contract.id}/status`, {
      method: 'PATCH',
      body: { status: nextStatus },
    })
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ステータス更新に失敗しました'
  }
}
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h4 mb-2">契約管理</h1>
          <p class="text-body-1 text-medium-emphasis">契約期間と手続きステータスを管理します。</p>
        </div>
        <VBtn color="primary" :disabled="!(members ?? []).length" @click="openCreateDialog">
          契約を追加
        </VBtn>
      </div>

      <VAlert v-if="!(members ?? []).length" type="info" variant="tonal" class="mb-4">
        先に担当者を登録してください。
      </VAlert>
      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <VCard>
        <VCardText>
          <VAlert v-if="error" type="error" variant="tonal">契約一覧の取得に失敗しました。</VAlert>
          <div v-else-if="status === 'pending'">読み込み中...</div>
          <VTable v-else>
            <thead>
              <tr>
                <th>担当者</th>
                <th>契約開始日</th>
                <th>契約終了日</th>
                <th>アラート日</th>
                <th>ステータス</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contract in data ?? []" :key="contract.id">
                <td>{{ memberLabelMap.get(contract.memberId) || contract.memberId }}</td>
                <td>{{ contract.startDate }}</td>
                <td>{{ contract.endDate }}</td>
                <td>{{ contract.alertDate || '-' }}</td>
                <td><StatusChip :status="contract.status" /></td>
                <td class="text-right">
                  <VBtn size="small" variant="text" @click="moveStatus(contract, 'prev')">戻す</VBtn>
                  <VBtn size="small" variant="text" @click="moveStatus(contract, 'next')">進める</VBtn>
                  <VBtn size="small" variant="text" @click="openEditDialog(contract)">編集</VBtn>
                </td>
              </tr>
              <tr v-if="(data ?? []).length === 0">
                <td colspan="6" class="text-center py-6">契約はまだ登録されていません</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>

      <VDialog v-model="dialog" max-width="720">
        <VCard>
          <VCardTitle>{{ editingId ? '契約を編集' : '契約を追加' }}</VCardTitle>
          <VCardText>
            <VSelect
              v-model="form.memberId"
              :items="members ?? []"
              :item-title="(member: Member) => memberLabelMap.get(member.id) ?? member.name"
              item-value="id"
              label="担当者"
            />
            <VTextField v-model="form.startDate" label="契約開始日" type="date" />
            <VTextField v-model="form.endDate" label="契約終了日" type="date" />
            <VTextarea v-model="form.note" label="備考" rows="3" />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn variant="text" @click="dialog = false">閉じる</VBtn>
            <VBtn color="primary" :loading="isSubmitting" @click="submitForm">保存</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </VContainer>
  </AppShell>
</template>