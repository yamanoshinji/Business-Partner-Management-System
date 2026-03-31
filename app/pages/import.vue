<script setup lang="ts">

const isSubmitting = ref(false)
const errorMessage = ref('')
const successResult = ref<{ companiesCreated: number; membersCreated: number; contractsCreated: number; organizationsCreated: number } | null>(null)
const importErrors = ref<Array<{ rowNumber: number; field: string; message: string }>>([])

const selectedFile = ref<File | null>(null)

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

async function submitImport(): Promise<void> {
  errorMessage.value = ''
  importErrors.value = []
  successResult.value = null
  isSubmitting.value = true

  if (!selectedFile.value) {
    errorMessage.value = 'ファイルを選択してください'
    isSubmitting.value = false
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await $fetch('/api/batch/import', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      successResult.value = response.stats
      selectedFile.value = null
    } else {
      importErrors.value = response.errors
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '取込に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

function reset(): void {
  selectedFile.value = null
  errorMessage.value = ''
  successResult.value = null
  importErrors.value = []
}
</script>

<template>
  <AppShell>
    <VContainer class="py-10">
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h4 mb-2">初期データ取込</h1>
          <p class="text-body-1 text-medium-emphasis">
            Excel ファイルから協力会社員情報を一括登録します。
          </p>
        </div>
      </div>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </VAlert>

      <VAlert v-if="successResult" type="success" variant="tonal" class="mb-4">
        <strong>取込が完了しました！</strong>
        <ul class="mt-2">
          <li>企業: {{ successResult.companiesCreated }} 件</li>
          <li>担当者: {{ successResult.membersCreated }} 件</li>
          <li>契約: {{ successResult.contractsCreated }} 件</li>
          <li>組織: {{ successResult.organizationsCreated }} 件</li>
        </ul>
        <VBtn class="mt-4" variant="outlined" @click="reset">
          別のファイルを取込む
        </VBtn>
      </VAlert>

      <VCard v-if="!successResult" class="mb-6">
        <VCardTitle>ファイル選択</VCardTitle>
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-4">
            以下の形式で作成した Excel ファイル（.xlsx）を選択してください。
          </p>
          <VTable>
            <thead>
              <tr>
                <th>列</th>
                <th>見出し</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>社員番号</td>
                <td>従業員識別番号</td>
              </tr>
              <tr>
                <td>B</td>
                <td>協力会社名</td>
                <td>企業名（必須）</td>
              </tr>
              <tr>
                <td>C</td>
                <td>協力会社員氏名</td>
                <td>担当者氏名（必須）</td>
              </tr>
              <tr>
                <td>D</td>
                <td>氏名ふりがな</td>
                <td>氏名のフリガナ</td>
              </tr>
              <tr>
                <td>E</td>
                <td>雇用形態</td>
                <td>職種・雇用形態</td>
              </tr>
              <tr>
                <td>F</td>
                <td>入場日</td>
                <td>雇用開始日（YYYY-MM-DD形式）</td>
              </tr>
              <tr>
                <td>G</td>
                <td>勤務場所</td>
                <td>勤務地（必須）</td>
              </tr>
              <tr>
                <td>H</td>
                <td>受入管理部門</td>
                <td>部門名（必須）</td>
              </tr>
              <tr>
                <td>I</td>
                <td>受入管理グループ</td>
                <td>グループ名（必須）</td>
              </tr>
              <tr>
                <td>J</td>
                <td>退場日</td>
                <td>（取込対象外）</td>
              </tr>
              <tr>
                <td>K</td>
                <td>現契約開始日</td>
                <td>契約開始日（YYYY-MM-DD形式、必須）</td>
              </tr>
              <tr>
                <td>L</td>
                <td>現契約終了日</td>
                <td>契約終了日（YYYY-MM-DD形式、必須）</td>
              </tr>
            </tbody>
          </VTable>

          <div class="mt-6">
            <VFileInput
              v-model:model-value="selectedFile"
              label="Excel ファイルを選択"
              accept=".xlsx"
              @change="onFileChange"
            />
          </div>
        </VCardText>
      </VCard>

      <VCard v-if="!successResult" class="mb-6">
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="selectedFile = null">
            リセット
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!selectedFile || isSubmitting"
            :loading="isSubmitting"
            @click="submitImport"
          >
            取込を実行
          </VBtn>
        </VCardActions>
      </VCard>

      <VCard v-if="importErrors.length > 0">
        <VCardTitle>取込エラー</VCardTitle>
        <VCardText>
          <p class="text-body-2 text-error mb-4">
            以下の行でエラーが発生しました。修正した上で再度取込してください。
          </p>
          <VTable>
            <thead>
              <tr>
                <th>行番号</th>
                <th>フィールド</th>
                <th>エラーメッセージ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(error, idx) in importErrors" :key="idx">
                <td>{{ error.rowNumber }}</td>
                <td>{{ error.field }}</td>
                <td class="text-error">{{ error.message }}</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VContainer>
  </AppShell>
</template>
