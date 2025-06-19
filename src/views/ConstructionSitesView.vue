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
              <TreeTable :value="getElectricalSections(slotProps.data)" :loading="loading">
                <Column field="name" header="Назва розділу" expander></Column>
                <Column field="itemsCount" header="Кількість позицій"></Column>
                <Column field="totalAmount" header="Сума">
                  <template #body="{ data }">
                    {{ formatCurrency(data.totalAmount) }}
                  </template>
                </Column>
                <Column header="Дії" style="width: 8rem">
                  <template #body="{ node }">
                    <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editSection(node.data)" />
                    <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                      @click="deleteSection(node.data)" />
                  </template>
                </Column>
              </TreeTable>
            </TabPanel>

            <!-- Сантехніка -->
            <TabPanel header="Сантехніка">
              <div class="mb-3">
                <Button label="Додати розділ" icon="pi pi-plus" class="p-button-outlined p-button-sm"
                  @click="openNewSectionDialog(slotProps.data, 'plumbing')" />
              </div>
              <TreeTable :value="getPlumbingSections(slotProps.data)" :loading="loading">
                <Column field="name" header="Назва розділу" expander></Column>
                <Column field="itemsCount" header="Кількість позицій"></Column>
                <Column field="totalAmount" header="Сума">
                  <template #body="{ data }">
                    {{ formatCurrency(data.totalAmount) }}
                  </template>
                </Column>
                <Column header="Дії" style="width: 8rem">
                  <template #body="{ node }">
                    <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editSection(node.data)" />
                    <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                      @click="deleteSection(node.data)" />
                  </template>
                </Column>
              </TreeTable>
            </TabPanel>

            <!-- Переміщення товарів -->
            <TabPanel header="Переміщення товарів">
              <div class="mb-3">
                <Button label="Перемістити товари" icon="pi pi-send" class="p-button-success"
                  @click="openTransferDialog(slotProps.data)" />
              </div>
              <DataTable :value="getMovements(slotProps.data)" :loading="loading">
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
    <Dialog v-model:visible="siteDialog.visible"
      :header="siteDialog.mode === 'create' ? 'Новий об'єкт' : 'Редагування об'єкту'" modal class="p-fluid">
      <div class="grid">
        <div class="col-12">
          <div class="field">
            <label for="name">Назва*</label>
            <InputText id="name" v-model="siteDialog.data.name" required autofocus />
          </div>
        </div>
        <div class="col-12">
          <div class="field">
            <label for="address">Адреса</label>
            <InputText id="address" v-model="siteDialog.data.address" />
          </div>
        </div>
        <div class="col-12">
          <div class="field">
            <label for="status">Статус</label>
            <Dropdown id="status" v-model="siteDialog.data.status" :options="siteStatuses" optionLabel="label"
              optionValue="value" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeSiteDialog" />
        <Button label="Зберегти" icon="pi pi-check" @click="saveSite" />
      </template>
    </Dialog>

    <!-- Діалог розділу -->
    <Dialog v-model:visible="sectionDialog.visible"
      :header="sectionDialog.mode === 'create' ? 'Новий розділ' : 'Редагування розділу'" modal class="p-fluid">
      <div class="field">
        <label for="sectionName">Назва*</label>
        <InputText id="sectionName" v-model="sectionDialog.data.name" required autofocus />
      </div>
      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeSectionDialog" />
        <Button label="Зберегти" icon="pi pi-check" @click="saveSection" />
      </template>
    </Dialog>

    <!-- Діалог переміщення товарів -->
    <Dialog v-model:visible="transferDialog.visible" header="Переміщення товарів" modal class="p-fluid" maximizable>
      <div class="grid">
        <div class="col-12">
          <div class="field">
            <label for="section">Розділ*</label>
            <Dropdown id="section" v-model="transferDialog.data.sectionId" :options="getAllSections()"
              optionLabel="name" optionValue="id" required />
          </div>
        </div>
      </div>

      <DataTable :value="transferDialog.data.items" class="p-datatable-sm" :scrollable="true" scrollHeight="400px">
        <Column field="code" header="Код">
          <template #body="{ data, index }">
            <AutoComplete v-model="data.code" :suggestions="productSuggestions" @complete="searchProducts($event)"
              @item-select="onProductSelect($event, index)" field="code" />
          </template>
        </Column>
        <Column field="name" header="Назва" />
        <Column field="availableQuantity" header="Доступно" />
        <Column field="quantity" header="Кількість">
          <template #body="{ data, index }">
            <InputNumber v-model="data.quantity" :max="data.availableQuantity" :min="1" />
          </template>
        </Column>
        <Column style="width: 4rem">
          <template #body="{ index }">
            <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
              @click="removeTransferItem(index)" />
          </template>
        </Column>
      </DataTable>

      <div class="flex justify-content-between align-items-center mt-2">
        <Button label="Додати позицію" icon="pi pi-plus" class="p-button-text" @click="addTransferItem" />
      </div>

      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeTransferDialog" />
        <Button label="Перемістити" icon="pi pi-check" @click="saveTransfer" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import TreeTable from 'primevue/treetable'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import AutoComplete from 'primevue/autocomplete'
import InputNumber from 'primevue/inputnumber'
import type { TreeNode } from 'primevue/tree'

interface ConstructionSite {
  id?: number
  name: string
  address: string
  status: 'active' | 'completed' | 'suspended'
}

interface Section {
  id?: number
  siteId?: number
  type: 'electrical' | 'plumbing'
  name: string
  parentId?: number
  itemsCount?: number
  totalAmount?: number
}

interface TransferItem {
  code: string
  name: string
  productId?: number
  quantity: number
  availableQuantity?: number
}

const toast = useToast()
const loading = ref(false)
const sites = ref<ConstructionSite[]>([])
const expandedRows = ref<ConstructionSite[]>([])
const productSuggestions = ref<any[]>([])

// Діалоги
const siteDialog = ref({
  visible: false,
  mode: 'create',
  data: {} as ConstructionSite
})

const sectionDialog = ref({
  visible: false,
  mode: 'create',
  data: {} as Section,
  parentSite: null as ConstructionSite | null,
  type: 'electrical' as 'electrical' | 'plumbing'
})

const transferDialog = ref({
  visible: false,
  data: {
    siteId: null as number | null,
    sectionId: null as number | null,
    items: [] as TransferItem[]
  }
})

// Статуси об'єкту
const siteStatuses = [
  { label: 'Активний', value: 'active' },
  { label: 'Завершений', value: 'completed' },
  { label: 'Призупинений', value: 'suspended' }
]

// Методи форматування
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uk-UA')
}

// Допоміжні методи
const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'info'
    case 'suspended': return 'warning'
    default: return null
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Активний'
    case 'completed': return 'Завершений'
    case 'suspended': return 'Призупинений'
    default: return status
  }
}

// Методи для об'єктів
const openNewSiteDialog = () => {
  siteDialog.value = {
    visible: true,
    mode: 'create',
    data: {
      name: '',
      address: '',
      status: 'active'
    }
  }
}

const editSite = (site: ConstructionSite) => {
  siteDialog.value = {
    visible: true,
    mode: 'edit',
    data: { ...site }
  }
}

const closeSiteDialog = () => {
  siteDialog.value.visible = false
}

const saveSite = async () => {
  try {
    // TODO: Implement API call
    await loadSites()
    closeSiteDialog()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Об'єкт збережено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти об'єкт',
      life: 3000
    })
  }
}

const deleteSite = async (site: ConstructionSite) => {
  try {
    // TODO: Implement API call
    await loadSites()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Об'єкт видалено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити об'єкт',
      life: 3000
    })
  }
}

// Методи для розділів
const getElectricalSections = (site: ConstructionSite): TreeNode[] => {
  // TODO: Implement API call
  return []
}

const getPlumbingSections = (site: ConstructionSite): TreeNode[] => {
  // TODO: Implement API call
  return []
}

const openNewSectionDialog = (site: ConstructionSite, type: 'electrical' | 'plumbing') => {
  sectionDialog.value = {
    visible: true,
    mode: 'create',
    data: {
      siteId: site.id,
      type,
      name: ''
    },
    parentSite: site,
    type
  }
}

const editSection = (section: Section) => {
  sectionDialog.value = {
    visible: true,
    mode: 'edit',
    data: { ...section },
    parentSite: null,
    type: section.type
  }
}

const closeSectionDialog = () => {
  sectionDialog.value.visible = false
}

const saveSection = async () => {
  try {
    // TODO: Implement API call
    if (sectionDialog.value.parentSite) {
      expandedRows.value = [...expandedRows.value, sectionDialog.value.parentSite]
    }
    await loadSites()
    closeSectionDialog()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Розділ збережено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти розділ',
      life: 3000
    })
  }
}

const deleteSection = async (section: Section) => {
  try {
    // TODO: Implement API call
    await loadSites()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Розділ видалено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити розділ',
      life: 3000
    })
  }
}

// Методи для переміщення товарів
const openTransferDialog = (site: ConstructionSite) => {
  transferDialog.value = {
    visible: true,
    data: {
      siteId: site.id,
      sectionId: null,
      items: []
    }
  }
  addTransferItem()
}

const closeTransferDialog = () => {
  transferDialog.value.visible = false
}

const addTransferItem = () => {
  transferDialog.value.data.items.push({
    code: '',
    name: '',
    quantity: 1
  })
}

const removeTransferItem = (index: number) => {
  transferDialog.value.data.items.splice(index, 1)
}

const searchProducts = (event: { query: string }) => {
  // TODO: Implement product search
  productSuggestions.value = []
}

const onProductSelect = (event: { value: any }, index: number) => {
  const item = transferDialog.value.data.items[index]
  item.productId = event.value.id
  item.name = event.value.name
  item.availableQuantity = event.value.quantity
}

const saveTransfer = async () => {
  try {
    // TODO: Implement API call
    closeTransferDialog()
    await loadSites()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Товари переміщено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося перемістити товари',
      life: 3000
    })
  }
}

const getAllSections = () => {
  // TODO: Implement getting all sections for current site
  return []
}

const getMovements = (site: ConstructionSite) => {
  // TODO: Implement getting movements for site
  return []
}

// Загрузка даних
const loadSites = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    sites.value = []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити список об'єктів',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSites()
})
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
