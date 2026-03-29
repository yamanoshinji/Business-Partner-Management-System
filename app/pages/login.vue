<script setup lang="ts">
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function submitLogin(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value,
      },
    })

    await navigateTo('/')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインに失敗しました'
    errorMessage.value = message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <VMain class="d-flex align-center justify-center bg-grey-lighten-4">
    <VContainer class="py-16">
      <VRow justify="center">
        <VCol cols="12" sm="8" md="5" lg="4">
          <VCard elevation="8">
            <VCardTitle class="text-h5 pa-6 pb-2">
              管理者ログイン
            </VCardTitle>
            <VCardText class="pa-6 pt-4">
              <VForm @submit.prevent="submitLogin">
                <VTextField
                  v-model="username"
                  label="ユーザー名"
                  autocomplete="username"
                  required
                />
                <VTextField
                  v-model="password"
                  label="パスワード"
                  type="password"
                  autocomplete="current-password"
                  required
                />
                <VAlert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ errorMessage }}
                </VAlert>
                <VBtn
                  type="submit"
                  color="primary"
                  block
                  :loading="isSubmitting"
                >
                  ログイン
                </VBtn>
              </VForm>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </VMain>
</template>