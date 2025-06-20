<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Product, Section } from '@prisma/client';
import { useInventoryStore } from '@/stores/inventory';
import { useSectionsStore } from '@/stores/sections';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  visible: boolean;
  siteId: number;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'transfer-complete'): void;
}>();

const inventoryStore = useInventoryStore();
const sectionsStore = useSectionsStore();
const { products, loading: productsLoading } = storeToRefs(inventoryStore);
const { sections, loading: sectionsLoading } = storeToRefs(sectionsStore);

// Состояние формы
const selectedProduct = ref<Product | null>(null);
const selectedSection = ref<Section | null>(null);
const quantity = ref<number>(1);
const transferType = ref<'IN' | 'OUT'>('IN');
const comment = ref('');

// Загрузка данных
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    await Promise.all([
      inventoryStore.fetchProducts(),
      sectionsStore.fetchSectionsBySite(props.siteId)
    ]);
  }
}, { immediate: true });

// Фильтрованные разделы
const filteredSections = computed(() => {
  return sections.value.filter(section => section.constructionSiteId === props.siteId);
});

// Доступное количество для перемещения
const availableQuantity = computed(() => {
  if (!selectedProduct.value) return 0;
  
  if (transferType.value === 'IN') {
    // При перемещении на объект проверяем остаток на складе
    return inventoryStore.getProductStock(selectedProduct.value.id);
  } else {
    // При возврате проверяем остаток в разделе
    if (!selectedSection.value) return 0;
    return sectionsStore.getSectionProductQuantity(
      selectedSection.value.id,
      selectedProduct.value.id
    );
  }
});

// Валидация формы
const isFormValid = computed(() => {
  return selectedProduct.value &&
         selectedSection.value &&
         quantity.value > 0 &&
         quantity.value <= availableQuantity.value;
});

// Обработка перемещения
const handleTransfer = async () => {
  if (!selectedProduct.value || !selectedSection.value || !isFormValid.value) return;

  try {
    await inventoryStore.transferProduct({
      productId: selectedProduct.value.id,
      sectionId: selectedSection.value.id,
      quantity: quantity.value,
      type: transferType.value,
      comment: comment.value
    });

    // Сбрасываем форму
    selectedProduct.value = null;
    selectedSection.value = null;
    quantity.value = 1;
    comment.value = '';

    emit('transfer-complete');
    emit('update:modelValue', false);
  } catch (error) {
    // Ошибка будет обработана в store
  }
};

// Форматирование
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value);
};
</script>

<template>
  <Dialog v-model:visible="modelValue" header="Переміщення товарів" :modal="true" class="transfer-dialog">
    <div class="transfer-form">
      <!-- Тип перемещения -->
      <div class="field">
        <label>Тип переміщення</label>
        <div class="p-buttonset">
          <Button :class="{ 'p-button-outlined': transferType !== 'IN' }" @click="transferType = 'IN'"
            icon="pi pi-sign-in" label="На об'єкт" />
          <Button :class="{ 'p-button-outlined': transferType !== 'OUT' }" @click="transferType = 'OUT'"
            icon="pi pi-sign-out" label="Повернення" />
        </div>
      </div>

      <!-- Выбор раздела -->
      <div class="field">
        <label>Розділ</label>
        <Dropdown v-model="selectedSection" :options="filteredSections" optionLabel="name" placeholder="Оберіть розділ"
          class="w-full" />
      </div>

      <!-- Выбор товара -->
      <div class="field">
        <label>Товар</label>
        <Dropdown v-model="selectedProduct" :options="products" optionLabel="name" placeholder="Оберіть товар"
          class="w-full">
          <template #option="{ option }">
            <div class="product-option">
              <span>{{ option.name }}</span>
              <span class="text-sm text-500">
                {{ formatCurrency(option.price) }} / {{ option.unit }}
              </span>
            </div>
          </template>
        </Dropdown>
      </div>

      <!-- Количество -->
      <div class="field">
        <label>Кількість</label>
        <div class="p-inputgroup">
          <InputNumber v-model="quantity" :min="1" :max="availableQuantity" :step="1" class="w-full" showButtons />
          <span class="p-inputgroup-addon">
            {{ selectedProduct?.unit || 'шт.' }}
          </span>
        </div>
        <small v-if="selectedProduct" class="block mt-1">
          Доступно: {{ availableQuantity }} {{ selectedProduct.unit }}
        </small>
      </div>

      <!-- Комментарий -->
      <div class="field">
        <label>Коментар</label>
        <Textarea v-model="comment" rows="2" class="w-full" />
      </div>

      <!-- Итоговая сумма -->
      <div v-if="selectedProduct && quantity > 0" class="summary">
        <div class="text-lg">
          Сума: {{ formatCurrency(selectedProduct.price * quantity) }}
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="emit('update:modelValue', false)" />
      <Button label="Перемістити" icon="pi pi-check" :disabled="!isFormValid" @click="handleTransfer" />
    </template>
  </Dialog>
</template>

<style scoped>
.transfer-dialog {
  min-width: 30vw;
}

.transfer-form {
  padding: 1rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.product-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
}

.summary {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-200);
  text-align: right;
}
</style>
