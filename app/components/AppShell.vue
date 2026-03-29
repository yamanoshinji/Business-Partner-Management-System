<script setup lang="ts">
const route = useRoute()

const navigationItems = [
  { title: 'ダッシュボード', to: '/' },
  { title: '企業管理', to: '/companies' },
  { title: '担当者管理', to: '/members' },
  { title: '契約管理', to: '/contracts' },
]

const { user, clear } = useUserSession()

async function logout(): Promise<void> {
  await $fetch('/api/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <VLayout class="bg-grey-lighten-4">
    <VAppBar color="white" elevation="1">
      <VAppBarTitle class="font-weight-bold">
        協力会社員管理システム
      </VAppBarTitle>
      <template #append>
        <div class="mr-4 text-body-2 text-medium-emphasis">
          {{ user?.name ?? '管理者' }}
        </div>
        <VBtn variant="outlined" @click="logout">
          ログアウト
        </VBtn>
      </template>
    </VAppBar>

    <VNavigationDrawer width="240" permanent>
      <VList nav>
        <VListItem
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :active="route.path === item.to || route.path.startsWith(`${item.to}/`)"
          :title="item.title"
          rounded="lg"
          color="primary"
        />
      </VList>
    </VNavigationDrawer>

    <VMain>
      <slot />
    </VMain>
  </VLayout>
</template>