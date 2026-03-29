<script setup lang="ts">
import type { ContractStatus } from '../shared/types/contract'

const props = defineProps<{
  status: ContractStatus
}>()

const statusMap: Record<ContractStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: '未着手', color: 'grey' },
  ESTIMATE_REQUESTED: { label: '見積依頼済み', color: 'blue' },
  ESTIMATE_RECEIVED: { label: '見積受領済み', color: 'cyan-darken-1' },
  DRAFT_CREATED: { label: '契約書案作成済み', color: 'indigo' },
  DRAFT_CONFIRMED: { label: '契約書案確認依頼済み', color: 'deep-purple' },
  APPROVAL_CREATED: { label: '稟議作成済み', color: 'orange' },
  CONTRACT_SENT: { label: '契約書送付済み', color: 'teal' },
  CONTRACT_SIGNED: { label: '契約書押印済み', color: 'green' },
  CONTRACT_RECEIVED: { label: '契約書受領済み', color: 'light-green-darken-1' },
  SENT_TO_MANAGEMENT: { label: '経営管理部へ送付済み', color: 'brown' },
  COMPLETED: { label: '完了', color: 'success' },
}

const chip = computed(() => statusMap[props.status])
</script>

<template>
  <VChip :color="chip.color" size="small" variant="tonal">
    {{ chip.label }}
  </VChip>
</template>