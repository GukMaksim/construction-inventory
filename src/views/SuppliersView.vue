<template>
  <div class="suppliers-view">
    <div class="header">
      <h2>Постачальники</h2>
      <Button label="Додати постачальника" icon="pi pi-plus" @click="openNewSupplierDialog" />
    </div>

    <DataTable :value="suppliers" :paginator="true" :rows="10" :loading="loading" class="p-datatable-sm">
      <Column field="name" header="Назва" sortable />
      <Column field="contactPerson" header="Контактна особа" sortable />
      <Column field="phone" header="Телефон" />
      <Column field="email" header="Email" />
      <Column header="Дії">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editSupplier(slotProps.data)" />
          <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
            @click="deleteSupplier(slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? 'Новий постачальник' : 'Редагування постачальника'" modal>
      <div class="p-fluid">
        <div class="field">
          <label for="name">Назва</label>
          <InputText id="name" v-model="supplier.name" required />
        </div>
        <div class="field">
          <label for="contactPerson">Контактна особа</label>
          <InputText id="contactPerson" v-model="supplier.contactPerson" />
        </div>
        <div class="field">
          <label for="phone">Телефон</label>
          <InputText id="phone" v-model="supplier.phone" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <InputText id="email" v-model="supplier.email" type="email" />
        </div>
      </div>
      <template #footer>
        <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="closeDialog" />
        <Button label="Зберегти" icon="pi pi-check" @click="saveSupplier" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

interface Supplier {
  id?: number
  name: string
  contactPerson: string
  phone: string
  email: string
}

const toast = useToast()
const loading = ref(false)
const suppliers = ref<Supplier[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const supplier = ref<Supplier>({
  name: '',
  contactPerson: '',
  phone: '',
  email: ''
})

const loadSuppliers = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    suppliers.value = []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити список постачальників',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openNewSupplierDialog = () => {
  dialogMode.value = 'create'
  supplier.value = {
    name: '',
    contactPerson: '',
    phone: '',
    email: ''
  }
  dialogVisible.value = true
}

const editSupplier = (data: Supplier) => {
  dialogMode.value = 'edit'
  supplier.value = { ...data }
  dialogVisible.value = true
}

const deleteSupplier = async (data: Supplier) => {
  try {
    // TODO: Implement API call
    await loadSuppliers()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Постачальника видалено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити постачальника',
      life: 3000
    })
  }
}

const saveSupplier = async () => {
  try {
    // TODO: Implement API call
    await loadSuppliers()
    closeDialog()
    toast.add({
      severity: 'success',
      summary: 'Успішно',
      detail: 'Постачальника збережено',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти постачальника',
      life: 3000
    })
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  supplier.value = {
    name: '',
    contactPerson: '',
    phone: '',
    email: ''
  }
}

onMounted(() => {
  loadSuppliers()
})
</script>

<style scoped>
.suppliers-view {
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
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
}
</style>