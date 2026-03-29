<script setup lang="ts">
type DashboardCompany = {
  id: string
  name: string
}

type DashboardNotification = {
  id: string
  contractId: string
  message: string
  isRead: boolean
  triggeredAt: string
}

const { data: companies, refresh: refreshCompanies, error: companiesError, status: companiesStatus } = await useFetch<DashboardCompany[]>('/api/companies')
const { data: notifications, refresh: refreshNotifications, error: notificationsError, status: notificationsStatus } = await useFetch<DashboardNotification[]>('/api/notifications')

const unreadCount = computed(() => (notifications.value ?? []).filter(notification => !notification.isRead).length)

async function markAsRead(notificationId: string): Promise<void> {
  await $fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
  await refreshNotifications()
}
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4">ダッシュボード</h1>
        <div class="d-flex ga-3">
          <VChip color="primary" variant="flat">
            未読通知 {{ unreadCount }} 件
          </VChip>
          <VBtn color="primary" to="/contracts">
            契約管理へ
          </VBtn>
        </div>
      </div>

      <VRow class="mb-6">
          <VCol cols="12" md="4">
            <VCard>
              <VCardText>
                <div class="text-overline">登録企業数</div>
                <div class="text-h4 mt-2">{{ (companies ?? []).length }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="4">
            <VCard>
              <VCardText>
                <div class="text-overline">通知件数</div>
                <div class="text-h4 mt-2">{{ (notifications ?? []).length }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="4">
            <VCard>
              <VCardText>
                <div class="text-overline">未読通知</div>
                <div class="text-h4 mt-2">{{ unreadCount }}</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <VRow>
          <VCol cols="12" md="5">
            <VCard class="mb-6">
              <VCardTitle>登録企業</VCardTitle>
              <VCardText>
                <VAlert v-if="companiesError" type="error" variant="tonal">
                  企業一覧の取得に失敗しました。
                </VAlert>
                <div v-else-if="companiesStatus === 'pending'">読み込み中...</div>
                <VList v-else>
                  <VListItem
                    v-for="company in companies ?? []"
                    :key="company.id"
                    :title="company.name"
                    :to="`/companies/${company.id}`"
                  />
                  <VListItem v-if="(companies ?? []).length === 0" title="企業はまだ登録されていません" />
                </VList>
              </VCardText>
              <VCardActions>
                <VBtn color="primary" variant="text" @click="refreshCompanies">
                  再読み込み
                </VBtn>
                <VSpacer />
                <VBtn color="primary" to="/companies">
                  企業管理
                </VBtn>
              </VCardActions>
            </VCard>
          </VCol>

          <VCol cols="12" md="7">
            <VCard class="mb-6">
              <VCardTitle>通知一覧</VCardTitle>
              <VCardText>
                <VAlert v-if="notificationsError" type="error" variant="tonal">
                  通知一覧の取得に失敗しました。
                </VAlert>
                <div v-else-if="notificationsStatus === 'pending'">読み込み中...</div>
                <VList v-else>
                  <VListItem
                    v-for="notification in notifications ?? []"
                    :key="notification.id"
                    :subtitle="new Date(notification.triggeredAt).toLocaleString('ja-JP')"
                  >
                    <template #title>
                      <div class="d-flex align-center ga-2">
                        <span>{{ notification.message }}</span>
                        <VChip v-if="!notification.isRead" color="warning" size="x-small">未読</VChip>
                      </div>
                    </template>
                    <template #append>
                      <VBtn
                        v-if="!notification.isRead"
                        size="small"
                        variant="text"
                        @click="markAsRead(notification.id)"
                      >
                        既読にする
                      </VBtn>
                    </template>
                  </VListItem>
                  <VListItem v-if="(notifications ?? []).length === 0" title="通知はありません" />
                </VList>
              </VCardText>
              <VCardActions>
                <VBtn color="primary" variant="text" @click="refreshNotifications">
                  再読み込み
                </VBtn>
              </VCardActions>
            </VCard>
          </VCol>
        </VRow>
    </VContainer>
  </AppShell>
</template>