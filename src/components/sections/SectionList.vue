<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useSectionsStore } from '@/stores/sections';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  siteId: number;
  type: 'electrical' | 'plumbing';
}>();

const emit = defineEmits<{
  (e: 'edit', section: any): void;
  (e: 'delete', section: any): void;
}>();

const sectionsStore = useSectionsStore();
const { sections, loading } = storeToRefs(sectionsStore);

// Фильтрация разделов по типу
const filteredSections = computed(() => {
  return sections.value.filter(section => section.type === props.type);
});

// Вычисление итогов для раздела
const getSectionTotals = computed(() => {
  return (sectionId: number) => {
    const section = sections.value.find(s => s.id === sectionId);
    if (!section) return { itemsCount: 0, totalAmount: 0 };

    return section.stockMovements.reduce((acc, movement) => {
      if (movement.type === 'IN') {
        acc.itemsCount += movement.quantity;
        acc.totalAmount += movement.quantity * (movement.product.price || 0);
      } else if (movement.type === 'OUT') {
        acc.itemsCount -= movement.quantity;
        acc.totalAmount -= movement.quantity * (movement.product.price || 0);
      }
      return acc;
    }, { itemsCount: 0, totalAmount: 0 });
  };
});

// Форматирование валюты
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value);
};

// Загрузка разделов при монтировании и изменении siteId
watch(() => props.siteId, async (newId) => {
  if (newId) {
    await sectionsStore.fetchSectionsBySite(newId);
  }
}, { immediate: true });
</script>

<template>
  <div class="section-list">
    <DataTable :value="filteredSections" :loading="loading" class="p-datatable-sm" responsiveLayout="scroll"
      :showGridlines="true">
      <Column field="name" header="Назва">
        <template #body="{ data }">
          <div class="section-name">
            {{ data.name }}
            <Tag :value="data.status" :severity="data.status === 'ACTIVE' ? 'success' : 'warning'" />
          </div>
        </template>
      </Column>

      <Column header="Кількість позицій">
        <template #body="{ data }">
          {{ getSectionTotals(data.id).itemsCount }}
        </template>
      </Column>

      <Column header="Сума">
        <template #body="{ data }">
          {{ formatCurrency(getSectionTotals(data.id).totalAmount) }}
        </template>
      </Column>

      <Column header="Дії" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="emit('edit', data)" />
            <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
              @click="emit('delete', data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.section-list {
  margin: 1rem 0;
}

.section-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
