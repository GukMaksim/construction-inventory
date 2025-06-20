<template>
  <div class="construction-sites-view">
    <div class="header">
      <h2>Об'єкти будівництва</h2>
      <Button label="Створити об'єкт" icon="pi pi-plus" @click="openNewSiteDialog" />
    </div>

    <DataTable :value="sites" :paginator="true" :rows="10" :loading="loading" class="p-datatable-sm"
      v-model:expandedRows="expandedRows">
      <Column :expander="true" style="width: 3rem" />
      <Column field="name" header="Назва" sortable />
      <Column field="address" header="Адреса" sortable />
      <Column field="status" header="Статус" sortable>
        <template #body="{ data }">
          <Tag :severity="getStatusSeverity(data.status)">
            {{ getStatusLabel(data.status) }}
          </Tag>
        </template>
      </Column>
      <Column header="Дії" style="width: 8rem">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editSite(slotProps.data)" />
          <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
            @click="deleteSite(slotProps.data)" />
        </template>
      </Column>
      <template #expansion="slotProps">
        <div class="site-details p-3">
          <TabView>
            <!-- Електрика -->
            <TabPanel header="Електрика">
              <div class="mb-3">
                <Button label="Додати розділ" icon="pi pi-plus" class="p-button-outlined p-button-sm"
                  @click="openNewSectionDialog(slotProps.data, 'electrical')" />
              </div>
              <SectionList :site-id="slotProps.data.id" type="electrical" @edit="handleSectionEdit"
                @delete="handleSectionDelete" />
            </TabPanel>

            <!-- Сантехніка -->
            <TabPanel header="Сантехніка">
              <div class="mb-3">
                <Button label="Додати розділ" icon="pi pi-plus" class="p-button-outlined p-button-sm"
                  @click="openNewSectionDialog(slotProps.data, 'plumbing')" />
              </div>
              <SectionList :site-id="slotProps.data.id" type="plumbing" @edit="handleSectionEdit"
                @delete="handleSectionDelete" />
            </TabPanel>

            <!-- Переміщення товарів -->
            <TabPanel header="Переміщення товарів">
              <div class="mb-3">
                <Button label="Перемістити товари" icon="pi pi-send" class="p-button-success"
                  @click="openTransferDialog(slotProps.data)" />
              </div>
              <DataTable :value="getMovements(slotProps.data)" :loading="loading" class="p-datatable-sm">
                <Column field="date" header="Дата">
                  <template #body="{ data }">
                    {{ formatDate(data.date) }}
                  </template>
                </Column>
                <Column field="sectionName" header="Розділ" />
                <Column field="productName" header="Товар" />
                <Column field="quantity" header="Кількість" />
                <Column field="type" header="Тип">
                  <template #body="{ data }">
                    <Tag :severity="data.type === 'IN' ? 'success' : 'warning'">
                      {{ data.type === 'IN' ? 'Прихід' : 'Повернення' }}
                    </Tag>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>
          </TabView>
        </div>
      </template>
    </DataTable>

    <!-- Діалог об'єкту -->
    <Dialog v-model:visible="showSiteDialog" :header="editingSite ? 'Редагування об\'єкту' : 'Новий об\'єкт'" modal
      class="p-fluid">
      <div class="grid">
        <div class="col-12">
          <div class="field">
            <label for="name">Назва*</label>
            <InputText id="name" v-model="siteForm.name" required autofocus />
          </div>
        </div>
        <div class="col-12">
          <div class="field">
            <label for="address">Адреса</label>
            <InputText id="address" v-model="siteForm.address" />
          </div>
        </div>
        <div class="col-12">
          <div class="field">
            <label for="status">Статус</label>
            <Dropdown id="status" v-model="siteForm.status" :options="siteStatuses" optionLabel="label"
              optionValue="value" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="showSiteDialog = false" />
        <Button label="Зберегти" icon="pi pi-check" @click="saveSite" />
      </template>
    </Dialog>

    <!-- Діалог розділу -->
    <SectionDialog v-model="showSectionDialog" :section="editingSection" :site-id="selectedSiteId"
      :type="currentSectionType" @save="handleSectionSave" />

    <!-- Діалог переміщення товарів -->
    <TransferDialog v-model:visible="showTransferDialog" :site-id="selectedSiteForTransfer"
      @transfer-complete="handleTransferComplete" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSitesStore } from '@/stores/sites';
import { useSectionsStore } from '@/stores/sections';
import { storeToRefs } from 'pinia';
import SectionList from '@/components/sections/SectionList.vue';
import SectionDialog from '@/components/sections/SectionDialog.vue';
import TransferDialog from '@/components/transfers/TransferDialog.vue';
import { useInventoryStore } from '@/stores/inventory';

// Stores
const sitesStore = useSitesStore();
const sectionsStore = useSectionsStore();
const inventoryStore = useInventoryStore();
const { sites, loading, error } = storeToRefs(sitesStore);

// Состояние компонента
const expandedRows = ref([]);
const showSiteDialog = ref(false);
const showTransferDialog = ref(false);
const editingSite = ref<any>(null);
const currentSectionType = ref<'electrical' | 'plumbing'>('electrical');
const selectedSiteId = ref<number | null>(null);
const selectedSiteForTransfer = ref<number | null>(null);

const siteForm = ref({
  name: '',
  address: '',
  status: 'ACTIVE'
});

const sectionForm = ref({
  name: '',
  type: '',
  constructionSiteId: null as number | null
});

// Загрузка данных при монтировании
onMounted(async () => {
  await sitesStore.fetchSites();
});

// Форматирование и утилиты
const getStatusLabel = (status: string) => {
  const labels = {
    ACTIVE: 'Активний',
    COMPLETED: 'Завершений',
    ON_HOLD: 'Призупинений'
  };
  return labels[status as keyof typeof labels] || status;
};

const getStatusSeverity = (status: string) => {
  const severity = {
    ACTIVE: 'success',
    COMPLETED: 'info',
    ON_HOLD: 'warning'
  };
  return severity[status as keyof typeof severity] || 'info';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uk-UA');
};

// Обработчики диалогов
const openNewSiteDialog = () => {
  editingSite.value = null;
  siteForm.value = {
    name: '',
    address: '',
    status: 'ACTIVE'
  };
  showSiteDialog.value = true;
};

const openNewSectionDialog = (site: any, type: 'electrical' | 'plumbing') => {
  editingSection.value = null;
  currentSectionType.value = type;
  selectedSiteId.value = site.id;
  showSectionDialog.value = true;
};

const openTransferDialog = (site: any) => {
  selectedSiteForTransfer.value = site.id;
  showTransferDialog.value = true;
};

const editSite = (site: any) => {
  editingSite.value = site;
  siteForm.value = {
    name: site.name,
    address: site.address,
    status: site.status
  };
  showSiteDialog.value = true;
};

// Сохранение данных
const saveSite = async () => {
  try {
    if (editingSite.value) {
      await sitesStore.updateSite(editingSite.value.id, siteForm.value);
    } else {
      await sitesStore.createSite(siteForm.value);
    }
    showSiteDialog.value = false;
  } catch (err) {
    // Ошибка будет обработана в store
  }
};

const handleSectionSave = async (data: any) => {
  try {
    if (data.id) {
      await sectionsStore.updateSection(data.id, data);
    } else {
      await sectionsStore.createSection(data);
    }
    showSectionDialog.value = false;
    // Обновляем список разделов
    if (selectedSiteId.value) {
      await sectionsStore.fetchSectionsBySite(selectedSiteId.value);
    }
  } catch (err) {
    // Ошибка будет обработана в store
  }
};

const handleSectionEdit = (section: any) => {
  editingSection.value = section;
  currentSectionType.value = section.type;
  selectedSiteId.value = section.constructionSiteId;
  showSectionDialog.value = true;
};

const handleSectionDelete = async (section: any) => {
  if (confirm('Ви впевнені, що хочете видалити цей розділ?')) {
    try {
      await sectionsStore.deleteSection(section.id);
      if (selectedSiteId.value) {
        await sectionsStore.fetchSectionsBySite(selectedSiteId.value);
      }
    } catch (err) {
      // Ошибка будет обработана в store
    }
  }
};

const handleTransferComplete = async () => {
  // Обновляем данные после перемещения
  if (selectedSiteForTransfer.value) {
    await sectionsStore.fetchSectionsBySite(selectedSiteForTransfer.value);
  }
};

// Получение разделов по типу
const getElectricalSections = computed(() => {
  return (site: any) => {
    return site.sections?.filter((s: any) => s.type === 'electrical') || [];
  };
});

const getPlumbingSections = computed(() => {
  return (site: any) => {
    return site.sections?.filter((s: any) => s.type === 'plumbing') || [];
  };
});

const getMovements = (site: any) => {
  // Здесь будет логика получения движений товаров для объекта
  return [];
};
</script>

<style scoped>
.construction-sites-view {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h2 {
  margin: 0;
}

.site-details {
  background: var(--surface-card);
  border-radius: 6px;
}

:deep(.p-datatable-row-expansion) {
  background: var(--surface-ground);
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
}
</style>
