<template>
  <div class="home-view">
    <div class="grid">
      <!-- Основна статистика -->
      <div class="col-12 md:col-6 xl:col-3">
        <Card class="mb-0 stats-card">
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-box text-primary text-xl"></i>
              <span class="text-xl font-medium">Товари на складі</span>
            </div>
          </template>
          <template #content>
            <div class="text-3xl font-bold mb-2">{{ stats.totalProducts }}</div>
            <div class="text-500">Унікальних позицій</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 xl:col-3">
        <Card class="mb-0 stats-card">
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-building text-success text-xl"></i>
              <span class="text-xl font-medium">Активні об'єкти</span>
            </div>
          </template>
          <template #content>
            <div class="text-3xl font-bold mb-2">{{ stats.activeSites }}</div>
            <div class="text-500">У роботі</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 xl:col-3">
        <Card class="mb-0 stats-card">
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-wallet text-warning text-xl"></i>
              <span class="text-xl font-medium">Сума закупівель</span>
            </div>
          </template>
          <template #content>
            <div class="text-3xl font-bold mb-2">{{ formatCurrency(stats.totalPurchases) }}</div>
            <div class="text-500">За останні 30 днів</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 xl:col-3">
        <Card class="mb-0 stats-card">
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-exclamation-triangle text-danger text-xl"></i>
              <span class="text-xl font-medium">Низький запас</span>
            </div>
          </template>
          <template #content>
            <div class="text-3xl font-bold mb-2">{{ stats.lowStockItems }}</div>
            <div class="text-500">Потребують уваги</div>
          </template>
        </Card>
      </div>

      <!-- Графіки -->
      <div class="col-12 lg:col-6">
        <Card class="h-full">
          <template #title>
            Закупівлі по місяцях
          </template>
          <template #content>
            <Chart type="line" :data="purchasesChartData" :options="chartOptions" />
          </template>
        </Card>
      </div>

      <div class="col-12 lg:col-6">
        <Card class="h-full">
          <template #title>
            Розподіл по об'єктах
          </template>
          <template #content>
            <Chart type="doughnut" :data="siteDistributionData" :options="chartOptions" />
          </template>
        </Card>
      </div>

      <!-- Останні дії -->
      <div class="col-12 xl:col-8">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Останні накладні</span>
              <Button label="Всі накладні" icon="pi pi-external-link" class="p-button-text"
                @click="router.push('/inventory')" />
            </div>
          </template>
          <template #content>
            <DataTable :value="recentInvoices" :rows="5" class="p-datatable-sm">
              <Column field="date" header="Дата">
                <template #body="{ data }">
                  {{ formatDate(data.date) }}
                </template>
              </Column>
              <Column field="number" header="Номер" />
              <Column field="supplier" header="Постачальник" />
              <Column field="total" header="Сума">
                <template #body="{ data }">
                  {{ formatCurrency(data.total) }}
                </template>
              </Column>
              <Column style="width: 4rem">
                <template #body="{ data }">
                  <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewInvoice(data)" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <div class="col-12 xl:col-4">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Товари з низьким запасом</span>
              <Button label="Всі товари" icon="pi pi-external-link" class="p-button-text"
                @click="router.push('/inventory')" />
            </div>
          </template>
          <template #content>
            <DataTable :value="lowStockProducts" :rows="5" class="p-datatable-sm">
              <Column field="name" header="Назва" />
              <Column field="quantity" header="Залишок">
                <template #body="{ data }">
                  <span class="text-red-500 font-medium">{{ data.quantity }}</span>
                </template>
              </Column>
              <Column style="width: 4rem">
                <template #body="{ data }">
                  <Button icon="pi pi-search" class="p-button-text p-button-sm" @click="viewProduct(data)" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()

// Статистика
const stats = ref({
  totalProducts: 0,
  activeSites: 0,
  totalPurchases: 0,
  lowStockItems: 0
})

// Графік закупівель
const purchasesChartData = ref({
  labels: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень'],
  datasets: [
    {
      label: 'Сума закупівель',
      data: [0, 0, 0, 0, 0, 0],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.4
    }
  ]
})

// Графік розподілу по об'єктах
const siteDistributionData = ref({
  labels: ["Об'єкт 1", "Об'єкт 2", "Об'єкт 3", "Об'єкт 4", "Об'єкт 5"],
  datasets: [
    {
      data: [300000, 250000, 200000, 150000, 100000],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// Останні накладні
const recentInvoices = ref([])
const lowStockProducts = ref([])

// Форматування
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uk-UA')
}

// Дії
const viewInvoice = (invoice: any) => {
  // TODO: Implement invoice view
  console.log('View invoice:', invoice)
}

const viewProduct = (product: any) => {
  // TODO: Implement product view
  console.log('View product:', product)
}

// Завантаження даних
const loadDashboardData = async () => {
  try {
    // TODO: Implement API calls
    stats.value = {
      totalProducts: 1234,
      activeSites: 5,
      totalPurchases: 1500000,
      lowStockItems: 8
    }

    purchasesChartData.value.datasets[0].data = [650000, 590000, 800000, 810000, 560000, 550000]

    siteDistributionData.value = {
      labels: ['Сайт 1', 'Сайт 2', 'Сайт 3', 'Сайт 4', 'Сайт 5'],
      datasets: [
        {
          data: [300000, 250000, 200000, 150000, 100000],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }
      ]
    }

    recentInvoices.value = [
      {
        date: '2025-06-19',
        number: 'INV-001',
        supplier: 'ТОВ "Постачальник"',
        total: 150000
      }
    ]

    lowStockProducts.value = [
      {
        name: 'Кабель ВВГ 3х1.5',
        quantity: 5
      }
    ]
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.home-view {
  padding: 1.5rem;
}

.stats-card {
  :deep(.p-card-header) {
    padding-bottom: 0;
  }
}

:deep(.p-card) {
  height: 100%;
}

:deep(.p-chart) {
  min-height: 300px;
}
</style>