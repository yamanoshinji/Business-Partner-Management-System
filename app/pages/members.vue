<script setup lang="ts">
type Company = {
  id: string
  name: string
}

type Member = {
  id: string
  companyId: string
  name: string
  nameKana: string | null
  role: string | null
  note: string | null
}

type MemberForm = {
  companyId: string
  name: string
  nameKana: string
  role: string
  note: string
}

const { data: companies } = await useFetch<Company[]>('/api/companies')
const { data, refresh, error, status } = await useFetch<Member[]>('/api/members')

const dialog = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const editingId = ref<string | null>(null)
const form = reactive<MemberForm>({
  companyId: '',
  name: '',
  nameKana: '',
  role: '',
  note: '',
})

const companyNameMap = computed(() => new Map((companies.value ?? []).map(company => [company.id, company.name])))

function resetForm(): void {
  editingId.value = null
  errorMessage.value = ''
  form.companyId = ''
  form.name = ''
  form.nameKana = ''
  form.role = ''
  form.note = ''
}

function openCreateDialog(): void {
  resetForm()
  form.companyId = companies.value?.[0]?.id ?? ''
  dialog.value = true
}

function openEditDialog(member: Member): void {
  editingId.value = member.id
  errorMessage.value = ''
  form.companyId = member.companyId
  form.name = member.name
  form.nameKana = member.nameKana ?? ''
  form.role = member.role ?? ''
  form.note = member.note ?? ''
  dialog.value = true
}

async function submitForm(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      companyId: form.companyId,
      name: form.name,
      nameKana: form.nameKana,
      role: form.role,
      note: form.note,
    }

    if (editingId.value) {
      await $fetch(`/api/members/${editingId.value}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/members', { method: 'POST', body: payload })
    }

    dialog.value = false
    resetForm()
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '担当者の保存に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

async function deleteMember(member: Member): Promise<void> {
  const shouldDelete = window.confirm(`「${member.name}」を削除しますか？`)
  if (!shouldDelete) {
    return
  }

  try {
    await $fetch(`/api/members/${member.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '担当者の削除に失敗しました'
  }
}
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h4 mb-2">担当者管理</h1>
          <p class="text-body-1 text-medium-emphasis">協力会社員の情報を管理します。</p>
        </div>
        <VBtn color="primary" :disabled="!(companies ?? []).length" @click="openCreateDialog">
          担当者を追加
        </VBtn>
      </div>

      <VAlert v-if="!(companies ?? []).length" type="info" variant="tonal" class="mb-4">
        先に企業を登録してください。
      </VAlert>
      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <VCard>
        <VCardText>
          <VAlert v-if="error" type="error" variant="tonal">担当者一覧の取得に失敗しました。</VAlert>
          <div v-else-if="status === 'pending'">読み込み中...</div>
          <VTable v-else>
            <thead>
              <tr>
                <th>氏名</th>
                <th>所属企業</th>
                <th>役割</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in data ?? []" :key="member.id">
                <td><NuxtLink :to="`/members/${member.id}`">{{ member.name }}</NuxtLink></td>
                <td>{{ companyNameMap.get(member.companyId) || member.companyId }}</td>
                <td>{{ member.role || '-' }}</td>
                <td class="text-right">
                  <VBtn size="small" variant="text" @click="openEditDialog(member)">編集</VBtn>
                  <VBtn size="small" variant="text" color="error" @click="deleteMember(member)">削除</VBtn>
                </td>
              </tr>
              <tr v-if="(data ?? []).length === 0">
                <td colspan="4" class="text-center py-6">担当者はまだ登録されていません</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>

      <VDialog v-model="dialog" max-width="720">
        <VCard>
          <VCardTitle>{{ editingId ? '担当者を編集' : '担当者を追加' }}</VCardTitle>
          <VCardText>
            <VSelect
              v-model="form.companyId"
              :items="companies ?? []"
              item-title="name"
              item-value="id"
              label="所属企業"
            />
            <VTextField v-model="form.name" label="氏名" required />
            <VTextField v-model="form.nameKana" label="氏名カナ" />
            <VTextField v-model="form.role" label="担当役割" />
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