<script setup lang="ts">
type Company = {
  id: string
  name: string
  nameKana: string | null
  homepage: string | null
  article36ExpiryDate: string | null
  note: string | null
}

type Member = {
  id: string
  companyId: string
  name: string
  role: string | null
}

const route = useRoute()
const companyId = route.params.id as string

const { data: company, error: companyError, refresh: refreshCompany } = await useFetch<Company>(`/api/companies/${companyId}`)
const { data: members, error: membersError, refresh: refreshMembers } = await useFetch<Member[]>(`/api/members?companyId=${companyId}`)
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <VBtn variant="text" class="mb-4" to="/companies">企業一覧へ戻る</VBtn>

      <VAlert v-if="companyError" type="error" variant="tonal" class="mb-4">
        企業情報の取得に失敗しました。
      </VAlert>

      <VCard v-if="company" class="mb-6">
        <VCardTitle>{{ company.name }}</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6"><strong>企業名カナ:</strong> {{ company.nameKana || '-' }}</VCol>
            <VCol cols="12" md="6"><strong>ホームページ:</strong> {{ company.homepage || '-' }}</VCol>
            <VCol cols="12" md="6"><strong>36協定有効期限日:</strong> {{ company.article36ExpiryDate || '-' }}</VCol>
            <VCol cols="12"><strong>備考:</strong> {{ company.note || '-' }}</VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VBtn variant="text" @click="refreshCompany">更新</VBtn>
        </VCardActions>
      </VCard>

      <VCard>
        <VCardTitle>所属担当者</VCardTitle>
        <VCardText>
          <VAlert v-if="membersError" type="error" variant="tonal">
            担当者一覧の取得に失敗しました。
          </VAlert>
          <VList v-else>
            <VListItem
              v-for="member in members ?? []"
              :key="member.id"
              :title="member.name"
              :subtitle="member.role || '役割未設定'"
              :to="`/members/${member.id}`"
            />
            <VListItem v-if="(members ?? []).length === 0" title="所属担当者はまだ登録されていません" />
          </VList>
        </VCardText>
        <VCardActions>
          <VBtn variant="text" @click="refreshMembers">再読み込み</VBtn>
        </VCardActions>
      </VCard>
    </VContainer>
  </AppShell>
</template>