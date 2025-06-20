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
                  {{ data.quantity ?? 0 }}
                </div>
              </template>
            </Column>
            <Column field="avgPrice" header="Середня ціна" :sortable="true" style="width: 120px">
              <template #body="{ data }">
                {{ formatCurrency(data.avgPrice ?? data.price) }}
              </template>
            </Column>
            <Column header="Дії" style="width: 140px">
              <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editProduct(slotProps.data)" />
                <Button icon="pi pi-history" class="p-button-text p-button-sm"
                  @click="showProductHistory(slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                  @click="deleteProductHandler(slotProps.data)" />
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
            <Column header="Дії" style="width: 140px">
              <template #body="slotProps">
                <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewInvoice(slotProps.data)" />
                <Button icon="pi pi-print" class="p-button-text p-button-sm" @click="printInvoice(slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                  @click="deleteInvoiceHandler(slotProps.data)" />
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
              <AutoComplete v-if="invoiceDialog.mode !== 'view'" v-model="data.name" :suggestions="productSuggestions"
                @complete="searchProducts($event)" @item-select="onProductSelect($event, index)" field="name" />
              <span v-else>{{ data.name }}</span>
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
import api, { getSuppliers } from '@/api'

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

const suppliers = ref([]);

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

// Для выбора товара по названию
const searchProducts = (event: { query: string }) => {
  const query = event.query.toLowerCase();
  productSuggestions.value = store.products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      (product.barcode?.toLowerCase().includes(query) ?? false)
  );
};

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

// Delete methods
const deleteProductHandler = async (product: Product) => {
  try {
    await store.deleteProduct(product.id!);
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Товар видалено',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити товар',
      life: 3000
    });
  }
};

const deleteInvoiceHandler = async (invoice: Invoice) => {
  try {
    await store.deleteInvoice(invoice.id!);
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Накладну видалено',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити накладну',
      life: 3000
    });
  }
};

// Lifecycle
onMounted(async () => {
  await store.loadProducts();
  await store.loadInvoices();
  // Загрузка постачальників
  try {
    const response = await getSuppliers();
    suppliers.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити постачальників',
      life: 3000
    })
  }
})
</script>

<style scoped>
.inventory-view {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.content-tabs {
  margin-top: 1rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}

.md\:w-25rem {
  width: 25rem;
}

.text-red-500 {
  color: #ef4444;
}

.text-xl {
  font-size: 1.25rem;
}

.flex {
  display: flex;
}

.justify-content-between {
  justify-content: space-between;
}

.align-items-center {
  align-items: center;
}

.mt-2 {
  margin-top: 0.5rem;
}

.p-datatable-sm {
  font-size: 0.875rem;
}

.p-button-text {
  padding: 0.5rem 1rem;
}

.p-button-danger {
  color: #fff;
  background-color: #dc2626;
  border-color: #dc2626;
}

.p-button-success {
  color: #fff;
  background-color: #16a34a;
  border-color: #16a34a;
}

.p-input-icon-left {
  position: relative;
}

.p-input-icon-left .pi {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.p-dropdown {
  width: 100%;
}

.p-calendar {
  width: 100%;
}

.p-inputtext {
  width: 100%;
}

.p-button {
  min-width: 4rem;
}

.tag-success {
  background-color: #d1fae5;
  color: #065f46;
}

.tag-warning {
  background-color: #fee2e2;
  color: #b91c1c;
}
</style>
