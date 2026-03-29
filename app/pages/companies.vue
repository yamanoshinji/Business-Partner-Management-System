<script setup lang="ts">
type Company = {
  id: string
  name: string
  nameKana: string | null
  homepage: string | null
  article36ExpiryDate: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

type CompanyForm = {
  name: string
  nameKana: string
  homepage: string
  article36ExpiryDate: string
  note: string
}

const { data, refresh, error, status } = await useFetch<Company[]>('/api/companies')

const dialog = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const editingId = ref<string | null>(null)
const form = reactive<CompanyForm>({
  name: '',
  nameKana: '',
  homepage: '',
  article36ExpiryDate: '',
  note: '',
})

function resetForm(): void {
  editingId.value = null
  errorMessage.value = ''
  form.name = ''
  form.nameKana = ''
  form.homepage = ''
  form.article36ExpiryDate = ''
  form.note = ''
}

function openCreateDialog(): void {
  resetForm()
  dialog.value = true
}

function openEditDialog(company: Company): void {
  editingId.value = company.id
  errorMessage.value = ''
  form.name = company.name
  form.nameKana = company.nameKana ?? ''
  form.homepage = company.homepage ?? ''
  form.article36ExpiryDate = company.article36ExpiryDate ?? ''
  form.note = company.note ?? ''
  dialog.value = true
}

async function submitForm(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      name: form.name,
      nameKana: form.nameKana,
      homepage: form.homepage,
      article36ExpiryDate: form.article36ExpiryDate,
      note: form.note,
    }

    if (editingId.value) {
      await $fetch(`/api/companies/${editingId.value}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/companies', { method: 'POST', body: payload })
    }

    dialog.value = false
    resetForm()
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '企業の保存に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCompany(company: Company): Promise<void> {
  const shouldDelete = window.confirm(`「${company.name}」を削除しますか？`)
  if (!shouldDelete) {
    return
  }

  try {
    await $fetch(`/api/companies/${company.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '企業の削除に失敗しました'
  }
}
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h4 mb-2">企業管理</h1>
          <p class="text-body-1 text-medium-emphasis">
            協力会社の基本情報を管理します。
          </p>
        </div>
        <VBtn color="primary" @click="openCreateDialog">
          企業を追加
        </VBtn>
      </div>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <VCard>
        <VCardText>
          <VAlert v-if="error" type="error" variant="tonal">
            企業一覧の取得に失敗しました。
          </VAlert>
          <div v-else-if="status === 'pending'">読み込み中...</div>
          <VTable v-else>
            <thead>
              <tr>
                <th>企業名</th>
                <th>ホームページ</th>
                <th>36協定有効期限日</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in data ?? []" :key="company.id">
                <td>
                  <NuxtLink :to="`/companies/${company.id}`">{{ company.name }}</NuxtLink>
                </td>
                <td>{{ company.homepage || '-' }}</td>
                <td>{{ company.article36ExpiryDate || '-' }}</td>
                <td class="text-right">
                  <VBtn size="small" variant="text" @click="openEditDialog(company)">編集</VBtn>
                  <VBtn size="small" variant="text" color="error" @click="deleteCompany(company)">削除</VBtn>
                </td>
              </tr>
              <tr v-if="(data ?? []).length === 0">
                <td colspan="4" class="text-center py-6">企業はまだ登録されていません</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>

      <VDialog v-model="dialog" max-width="720">
        <VCard>
          <VCardTitle>{{ editingId ? '企業を編集' : '企業を追加' }}</VCardTitle>
          <VCardText>
            <VForm @submit.prevent="submitForm">
              <VTextField v-model="form.name" label="企業名" required />
              <VTextField v-model="form.nameKana" label="企業名カナ" />
              <VTextField v-model="form.homepage" label="ホームページ" />
              <VTextField v-model="form.article36ExpiryDate" label="36協定有効期限日" type="date" />
              <VTextarea v-model="form.note" label="備考" rows="3" />
            </VForm>
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