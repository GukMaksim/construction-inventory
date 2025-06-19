<template>
  <div class="reports-view">
    <div class="header">
      <h2>Звіти</h2>
    </div>

    <TabView>
      <!-- Звіт по об'єктах -->
      <TabPanel header="По об'єктах">
        <div class="grid">
          <div class="col-12 md:col-4">
            <div class="field">
              <label>Об'єкт</label>
              <Dropdown v-model="sitesReport.selectedSite" :options="sites" optionLabel="name" placeholder="Всі об'єкти"
                class="w-full" />
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="field">
              <label>Період</label>
              <Calendar v-model="sitesReport.dateRange" selectionMode="range" :showIcon="true" dateFormat="dd.mm.yy"
                class="w-full" />
            </div>
          </div>
          <div class="col-12 md:col-4 flex align-items-end">
            <Button label="Сформувати" icon="pi pi-refresh" @click="generateSitesReport" :loading="loading" />
          </div>
        </div>

        <div v-if="sitesReport.data" class="mt-4">
          <Card class="mb-4">
            <template #title>Загальна інформація</template>
            <template #content>
              <div class="grid">
                <div class="col-12 md:col-3">
                  <div class="stats-item">
                    <label>Загальна сума витрат:</label>
                    <div class="text-2xl">{{ formatCurrency(sitesReport.data.totalAmount) }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-3">
                  <div class="stats-item">
                    <label>Кількість позицій:</label>
                    <div class="text-2xl">{{ sitesReport.data.totalItems }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-3">
                  <div class="stats-item">
                    <label>Електрика:</label>
                    <div class="text-2xl">{{ formatCurrency(sitesReport.data.electricalAmount) }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-3">
                  <div class="stats-item">
                    <label>Сантехніка:</label>
                    <div class="text-2xl">{{ formatCurrency(sitesReport.data.plumbingAmount) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <DataTable :value="sitesReport.data.details" :loading="loading" class="p-datatable-sm">
            <Column field="section" header="Розділ" />
            <Column field="itemsCount" header="Кількість позицій" />
            <Column field="amount" header="Сума">
              <template #body="{ data }">
                {{ formatCurrency(data.amount) }}
              </template>
            </Column>
            <Column field="percentage" header="% від загального">
              <template #body="{ data }">
                {{ data.percentage.toFixed(2) }}%
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- Звіт по постачальниках -->
      <TabPanel header="По постачальниках">
        <div class="grid">
          <div class="col-12 md:col-4">
            <div class="field">
              <label>Постачальник</label>
              <Dropdown v-model="suppliersReport.selectedSupplier" :options="suppliers" optionLabel="name"
                placeholder="Всі постачальники" class="w-full" />
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="field">
              <label>Період</label>
              <Calendar v-model="suppliersReport.dateRange" selectionMode="range" :showIcon="true" dateFormat="dd.mm.yy"
                class="w-full" />
            </div>
          </div>
          <div class="col-12 md:col-4 flex align-items-end">
            <Button label="Сформувати" icon="pi pi-refresh" @click="generateSuppliersReport" :loading="loading" />
          </div>
        </div>

        <div v-if="suppliersReport.data" class="mt-4">
          <Chart type="bar" :data="suppliersReport.chartData" :options="chartOptions" class="mb-4" />

          <DataTable :value="suppliersReport.data" :loading="loading" class="p-datatable-sm">
            <Column field="name" header="Постачальник" sortable />
            <Column field="invoicesCount" header="Кількість накладних" sortable />
            <Column field="itemsCount" header="Кількість позицій" sortable />
            <Column field="totalAmount" header="Загальна сума" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.totalAmount) }}
              </template>
            </Column>
            <Column field="avgAmount" header="Середня сума" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.avgAmount) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- Звіт по залишках -->
      <TabPanel header="Залишки">
        <div class="grid">
          <div class="col-12 md:col-8">
            <div class="field">
              <label>Пошук</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText v-model="stockReport.searchQuery" placeholder="Пошук за назвою або кодом" class="w-full" />
              </span>
            </div>
          </div>
          <div class="col-12 md:col-4 flex align-items-end">
            <Button label="Сформувати" icon="pi pi-refresh" @click="generateStockReport" :loading="loading" />
            <Button label="Експорт" icon="pi pi-download" class="p-button-success ml-2" @click="exportStockReport"
              :disabled="!stockReport.data" />
          </div>
        </div>

        <div v-if="stockReport.data" class="mt-4">
          <Card class="mb-4">
            <template #title>Загальна інформація по складу</template>
            <template #content>
              <div class="grid">
                <div class="col-12 md:col-4">
                  <div class="stats-item">
                    <label>Загальна вартість:</label>
                    <div class="text-2xl">{{ formatCurrency(stockReport.data.totalValue) }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-4">
                  <div class="stats-item">
                    <label>Унікальних позицій:</label>
                    <div class="text-2xl">{{ stockReport.data.uniqueItems }}</div>
                  </div>
                </div>
                <div class="col-12 md:col-4">
                  <div class="stats-item">
                    <label>Позицій з низьким запасом:</label>
                    <div class="text-2xl text-red-500">{{ stockReport.data.lowStockItems }}</div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <DataTable :value="stockReport.data.items" :loading="loading" :paginator="true" :rows="10"
            class="p-datatable-sm">
            <Column field="code" header="Код" sortable />
            <Column field="name" header="Назва" sortable />
            <Column field="unit" header="Од. вим." sortable />
            <Column field="totalQuantity" header="Загальна кількість" sortable>
              <template #body="{ data }">
                <div :class="{ 'text-red-500': data.totalQuantity <= data.minQuantity }">
                  {{ data.totalQuantity }}
                </div>
              </template>
            </Column>
            <Column field="inStock" header="На складі" sortable />
            <Column field="allocated" header="На об'єктах" sortable />
            <Column field="price" header="Ціна" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.price) }}
              </template>
            </Column>
            <Column field="totalValue" header="Вартість" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.totalValue) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'

const loading = ref(false)

// Форматування
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value)
}

// Звіт по об'єктах
const sitesReport = ref({
  selectedSite: null,
  dateRange: null,
  data: null as any
})

const generateSitesReport = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    sitesReport.value.data = {
      totalAmount: 0,
      totalItems: 0,
      electricalAmount: 0,
      plumbingAmount: 0,
      details: []
    }
  } catch (error) {
    console.error('Failed to generate sites report:', error)
  } finally {
    loading.value = false
  }
}

// Звіт по постачальниках
const suppliersReport = ref({
  selectedSupplier: null,
  dateRange: null,
  data: null as any[],
  chartData: {
    labels: [],
    datasets: [{
      label: 'Сума закупівель',
      data: []
    }]
  }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    }
  }
}

const generateSuppliersReport = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    suppliersReport.value.data = []
    suppliersReport.value.chartData = {
      labels: [],
      datasets: [{
        label: 'Сума закупівель',
        data: []
      }]
    }
  } catch (error) {
    console.error('Failed to generate suppliers report:', error)
  } finally {
    loading.value = false
  }
}

// Звіт по залишках
const stockReport = ref({
  searchQuery: '',
  data: null as any
})

const generateStockReport = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    stockReport.value.data = {
      totalValue: 0,
      uniqueItems: 0,
      lowStockItems: 0,
      items: []
    }
  } catch (error) {
    console.error('Failed to generate stock report:', error)
  } finally {
    loading.value = false
  }
}

const exportStockReport = () => {
  // TODO: Implement export functionality
  console.log('Exporting stock report...')
}

// Дані для фільтрів
const sites = ref([])
const suppliers = ref([])

// Завантаження початкових даних
const loadInitialData = async () => {
  try {
    // TODO: Implement loading sites and suppliers
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

loadInitialData()
</script>

<style scoped>
.reports-view {
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

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
}

.stats-item {
  background: var(--surface-card);
  padding: 1rem;
  border-radius: 6px;
  height: 100%;
}

.stats-item label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}
</style>
