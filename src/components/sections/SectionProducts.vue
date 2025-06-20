<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSectionsStore } from '@/stores/sections';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  sectionId: number;
}>();

const sectionsStore = useSectionsStore();
const { currentSection, loading } = storeToRefs(sectionsStore);

// Загрузка данных раздела
onMounted(async () => {
  await sectionsStore.fetchSectionById(props.sectionId);
});

// Форматирование
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uk-UA');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value);
};

// Вычисление остатков
const getProductBalance = (productId: number) => {
  if (!currentSection.value) return 0;
  
  return currentSection.value.stockMovements
    .filter(m => m.productId === productId)
    .reduce((acc, movement) => {
      return acc + (movement.type === 'IN' ? movement.quantity : -movement.quantity);
    }, 0);
};

// Группировка движений по товарам
const groupedMovements = computed(() => {
  if (!currentSection.value) return [];

  const groups = currentSection.value.stockMovements.reduce((acc, movement) => {
    const key = movement.productId;
    if (!acc[key]) {
      acc[key] = {
        product: movement.product,
        movements: [],
        balance: 0
      };
    }
    acc[key].movements.push(movement);
    acc[key].balance = getProductBalance(key);
    return acc;
  }, {} as Record<number, any>);

  return Object.values(groups);
});
</script>

<template>
  <div class="section-products">
    <ProgressSpinner v-if="loading" />

    <div v-else-if="currentSection" class="grid">
      <div class="col-12">
        <h3>{{ currentSection.name }}</h3>
        <Tag :value="currentSection.status" :severity="currentSection.status === 'ACTIVE' ? 'success' : 'warning'" />
      </div>

      <div class="col-12">
        <DataTable :value="groupedMovements" class="p-datatable-sm">
          <Column field="product.name" header="Товар" />
          <Column field="balance" header="Залишок" />
          <Column header="Рух товару">
            <template #body="{ data }">
              <Timeline :value="data.movements" class="movement-timeline">
                <template #content="{ item }">
                  <div class="movement-item">
                    <small>{{ formatDate(item.date) }}</small>
                    <Tag :severity="item.type === 'IN' ? 'success' : 'warning'">
                      {{ item.type === 'IN' ? 'Прихід' : 'Повернення' }}:
                      {{ item.quantity }} {{ item.product.unit }}
                    </Tag>
                    <div class="movement-price">
                      {{ formatCurrency(item.quantity * item.product.price) }}
                    </div>
                  </div>
                </template>
              </Timeline>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div v-else class="empty-state">
      Розділ не знайдено
    </div>
  </div>
</template>

<style scoped>
.section-products {
  padding: 1rem;
}

.movement-timeline {
  max-height: 200px;
  overflow-y: auto;
}

.movement-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--surface-200);
}

.movement-price {
  margin-left: auto;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}
</style>
