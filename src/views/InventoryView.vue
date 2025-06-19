<template>
  <div class="inventory-view">
    <div class="header">
      <h2>Склад</h2>
      <div class="header-buttons">
        <Button label="Нова накладна" icon="pi pi-plus" class="p-button-success mr-2" @click="openNewInvoiceDialog" />
        <Button label="Новий товар" icon="pi pi-plus" @click="openNewProductDialog" />
      </div>
    </div>

    <div class="content-tabs">
      <TabView>
        <!-- Товари -->
        <TabPanel header="Товари">
          <div class="mb-3">
            <span class="p-input-icon-left w-full md:w-25rem">
              <i class="pi pi-search" />
              <InputText v-model="productSearch" placeholder="Пошук за назвою, кодом або штрихкодом" class="w-full" />
            </span>
          </div>

          <DataTable :value="filteredProducts" :paginator="true" :rows="10" :loading="loading" class="p-datatable-sm"
            :rowHover="true" v-model:filters="filters" filterDisplay="menu"
            :globalFilterFields="['code', 'name', 'barcode']">
            <Column field="code" header="Код" sortable />
            <Column field="name" header="Назва" sortable />
            <Column field="barcode" header="Штрихкод" />
            <Column field="unit" header="Од. вим." :sortable="true" />
            <Column field="quantity" header="Кількість" :sortable="true" style="width: 120px">
              <template #body="{ data }">
                <div :class="{ 'text-red-500': data.quantity <= 0 }">
                  {{ data.quantity }}
                </div>
              </template>
            </Column>
            <Column field="price" header="Ціна" :sortable="true" style="width: 120px">
              <template #body="{ data }">
                {{ formatCurrency(data.price) }}
              </template>
            </Column>
            <Column header="Дії" style="width: 100px">
              <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editProduct(slotProps.data)" />
                <Button icon="pi pi-history" class="p-button-text p-button-sm"
                  @click="showProductHistory(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- Накладні -->
        <TabPanel header="Накладні">
          <DataTable :value="invoices" :paginator="true" :rows="10" :loading="loading" class="p-datatable-sm"
            :rowHover="true">
            <Column field="number" header="Номер" sortable />
            <Column field="date" header="Дата" sortable>
              <template #body="{ data }">
                {{ formatDate(data.date) }}
              </template>
            </Column>
            <Column field="supplierName" header="Постачальник" sortable />
            <Column field="total" header="Сума" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.total) }}
              </template>
            </Column>
            <Column header="Дії" style="width: 100px">
              <template #body="slotProps">
                <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewInvoice(slotProps.data)" />
                <Button icon="pi pi-print" class="p-button-text p-button-sm" @click="printInvoice(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>
    </div>

    <!-- Діалог товару -->
    <Dialog v-model:visible="productDialog.visible"
      :header="productDialog.mode === 'create' ? 'Новий товар' : 'Редагування товару'" modal class="p-fluid">
      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="code">Код*</label>
            <InputText id="code" v-model="productDialog.data.code" required autofocus />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="barcode">Штрихкод</label>
            <InputText id="barcode" v-model="productDialog.data.barcode" />
          </div>
        </div>
        <div class="col-12">
          <div class="field">
            <label for="name">Назва*</label>
            <InputText id="name" v-model="productDialog.data.name" required />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="unit">Одиниця виміру*</label>
            <Dropdown id="unit" v-model="productDialog.data.unit" :options="units" optionLabel="label"
              optionValue="value" required />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="price">Ціна*</label>
            <InputNumber id="price" v-model="productDialog.data.price" mode="currency" currency="UAH" locale="uk-UA"
              required />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeProductDialog" />
        <Button label="Зберегти" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

    <!-- Діалог накладної -->
    <Dialog v-model:visible="invoiceDialog.visible"
      :header="invoiceDialog.mode === 'create' ? 'Нова накладна' : 'Перегляд накладної'" modal class="p-fluid"
      maximizable>
      <div class="grid">
        <div class="col-12 md:col-4">
          <div class="field">
            <label for="invoiceNumber">Номер накладної*</label>
            <InputText id="invoiceNumber" v-model="invoiceDialog.data.number" required
              :disabled="invoiceDialog.mode === 'view'" />
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="field">
            <label for="invoiceDate">Дата*</label>
            <Calendar id="invoiceDate" v-model="invoiceDialog.data.date" dateFormat="dd.mm.yy"
              :disabled="invoiceDialog.mode === 'view'" />
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="field">
            <label for="supplier">Постачальник*</label>
            <Dropdown id="supplier" v-model="invoiceDialog.data.supplierId" :options="suppliers" optionLabel="name"
              optionValue="id" :disabled="invoiceDialog.mode === 'view'" @change="onSupplierChange" />
          </div>
        </div>
      </div>

      <div class="invoice-items mb-3">
        <DataTable :value="invoiceDialog.data.items" class="p-datatable-sm" :scrollable="true" scrollHeight="400px"
          v-if="invoiceDialog.visible">
          <Column field="code" header="Код">
            <template #body="{ data, index }">
              <AutoComplete v-if="invoiceDialog.mode !== 'view'" v-model="data.code" :suggestions="productSuggestions"
                @complete="searchProducts($event)" @item-select="onProductSelect($event, index)" field="code" />
              <span v-else>{{ data.code }}</span>
            </template>
          </Column>
          <Column field="name" header="Назва" />
          <Column field="quantity" header="Кількість" style="width: 150px">
            <template #body="{ data, index }">
              <InputNumber v-if="invoiceDialog.mode !== 'view'" v-model="data.quantity" @input="updateItemTotal(index)"
                :min="0" :step="1" />
              <span v-else>{{ data.quantity }}</span>
            </template>
          </Column>
          <Column field="price" header="Ціна" style="width: 150px">
            <template #body="{ data, index }">
              <InputNumber v-if="invoiceDialog.mode !== 'view'" v-model="data.price" mode="currency" currency="UAH"
                locale="uk-UA" @input="updateItemTotal(index)" />
              <span v-else>{{ formatCurrency(data.price) }}</span>
            </template>
          </Column>
          <Column field="total" header="Сума" style="width: 150px">
            <template #body="{ data }">
              {{ formatCurrency(data.total) }}
            </template>
          </Column>
          <Column v-if="invoiceDialog.mode !== 'view'" style="width: 80px">
            <template #body="{ index }">
              <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                @click="removeInvoiceItem(index)" />
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-content-between align-items-center mt-2">
          <Button v-if="invoiceDialog.mode !== 'view'" label="Додати позицію" icon="pi pi-plus" class="p-button-text"
            @click="addInvoiceItem" />
          <div class="text-xl">
            Всього: {{ formatCurrency(invoiceTotal) }}
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeInvoiceDialog" />
        <Button v-if="invoiceDialog.mode !== 'view'" label="Зберегти" icon="pi pi-check" @click="saveInvoice" />
      </template>
    </Dialog>

    <!-- Діалог історії товару -->
    <Dialog v-model:visible="historyDialog.visible" :header="'Історія руху: ' + (historyDialog.product?.name || '')"
      modal maximizable>
      <DataTable :value="historyDialog.movements" :loading="loading" class="p-datatable-sm">
        <Column field="date" header="Дата">
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>
        <Column field="type" header="Тип">
          <template #body="{ data }">
            <Tag :severity="data.type === 'IN' ? 'success' : 'warning'">
              {{ data.type === 'IN' ? 'Прихід' : 'Видача' }}
            </Tag>
          </template>
        </Column>
        <Column field="quantity" header="Кількість" />
        <Column field="sourceName" header="Джерело" />
        <Column field="destinationName" header="Призначення" />
        <Column field="documentType" header="Документ">
          <template #body="{ data }">
            {{ data.documentType === 'INVOICE' ? 'Накладна' : 'Переміщення' }}
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { storeToRefs } from 'pinia'
import type { Product, Invoice, InvoiceItem, Unit, InventoryMovement } from '@/types/inventory'
import { useToast } from 'primevue/usetoast'

// Components
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Tag from 'primevue/tag'

const toast = useToast()
const store = useInventoryStore()
const { products, invoices, loading } = storeToRefs(store)

// Products
const productSearch = ref('')
const productSuggestions = ref<Product[]>([])
const filters = ref({})

const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value
  return store.searchProducts(productSearch.value)
})

const units: { label: string; value: Unit }[] = [
  { label: 'Штука', value: 'шт' },
  { label: 'Метр', value: 'м' },
  { label: 'Кілограм', value: 'кг' },
  { label: 'Літр', value: 'л' },
  { label: 'Упаковка', value: 'уп' },
  { label: 'Квадратний метр', value: 'м2' },
  { label: 'Кубічний метр', value: 'м3' }
]

const productDialog = ref({
  visible: false,
  mode: 'create',
  data: {} as Product
})

// Накладні
const invoiceDialog = ref({
  visible: false,
  mode: 'create',
  data: {
    number: '',
    date: new Date(),
    supplierId: null,
    items: [] as InvoiceItem[]
  } as Invoice
})

const invoiceTotal = computed(() => {
  return invoiceDialog.value.data.items.reduce((sum, item) => sum + (item.total || 0), 0)
})

// Історія товару
const historyDialog = ref({
  visible: false,
  product: null as Product | null,
  movements: [] as InventoryMovement[]
})

// Methods
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uk-UA')
}

// Product methods
const openNewProductDialog = () => {
  productDialog.value = {
    visible: true,
    mode: 'create',
    data: {
      code: '',
      name: '',
      barcode: '',
      unit: 'шт',
      quantity: 0,
      price: 0
    }
  }
}

const editProduct = (product: Product) => {
  productDialog.value = {
    visible: true,
    mode: 'edit',
    data: { ...product }
  }
}

const closeProductDialog = () => {
  productDialog.value.visible = false
}

const saveProduct = async () => {
  try {
    await store.saveProduct(productDialog.value.data)
    closeProductDialog()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Товар збережено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти товар',
      life: 3000
    })
  }
}

// Invoice methods
const openNewInvoiceDialog = () => {
  invoiceDialog.value = {
    visible: true,
    mode: 'create',
    data: {
      number: '',
      date: new Date(),
      supplierId: null,
      items: []
    }
  }
  addInvoiceItem()
}

const closeInvoiceDialog = () => {
  invoiceDialog.value.visible = false
}

const addInvoiceItem = () => {
  invoiceDialog.value.data.items.push({
    code: '',
    name: '',
    quantity: 1,
    price: 0,
    total: 0
  })
}

const removeInvoiceItem = (index: number) => {
  invoiceDialog.value.data.items.splice(index, 1)
}

const updateItemTotal = (index: number) => {
  const item = invoiceDialog.value.data.items[index]
  item.total = item.quantity * item.price
}

const searchProducts = (event: { query: string }) => {
  productSuggestions.value = store.searchProducts(event.query)
}

const onProductSelect = (event: { value: Product }, index: number) => {
  const item = invoiceDialog.value.data.items[index]
  item.productId = event.value.id
  item.name = event.value.name
  item.price = event.value.price
  updateItemTotal(index)
}

const viewInvoice = (invoice: Invoice) => {
  invoiceDialog.value = {
    visible: true,
    mode: 'view',
    data: { ...invoice }
  }
}

const saveInvoice = async () => {
  try {
    await store.saveInvoice(invoiceDialog.value.data)
    closeInvoiceDialog()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Накладну збережено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти накладну',
      life: 3000
    })
  }
}

const printInvoice = (invoice: Invoice) => {
  // TODO: Implement invoice printing
  console.log('Print invoice:', invoice)
}

const showProductHistory = async (product: Product) => {
  historyDialog.value.product = product
  historyDialog.value.visible = true
  // TODO: Load product movements
  historyDialog.value.movements = []
}

// Lifecycle
onMounted(async () => {
  await store.loadProducts()
  await store.loadInvoices()
})
</script>

<style scoped>
.inventory-view {
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

.content-tabs {
  margin-top: 1rem;
}

.invoice-items {
  margin-top: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-autocomplete) {
  width: 100%;
}
</style>
