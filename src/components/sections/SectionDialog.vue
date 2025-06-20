<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  section?: any;
  siteId: number;
  type: 'electrical' | 'plumbing';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: any): void;
}>();

const formData = ref({
  name: '',
  type: props.type,
  status: 'ACTIVE',
  constructionSiteId: props.siteId
});

// Заполнение формы при редактировании
watch(() => props.section, (newSection) => {
  if (newSection) {
    formData.value = {
      name: newSection.name,
      type: newSection.type,
      status: newSection.status,
      constructionSiteId: newSection.constructionSiteId
    };
  } else {
    formData.value = {
      name: '',
      type: props.type,
      status: 'ACTIVE',
      constructionSiteId: props.siteId
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', {
    ...formData.value,
    id: props.section?.id
  });
};

const handleHide = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <Dialog :visible="modelValue" :header="section ? 'Редагувати розділ' : 'Новий розділ'" :modal="true"
    @hide="handleHide">
    <div class="form-container">
      <div class="field">
        <label for="name">Назва розділу</label>
        <InputText id="name" v-model="formData.name" class="w-full" :class="{ 'p-invalid': !formData.name }" />
        <small v-if="!formData.name" class="p-error">Назва розділу обов'язкова</small>
      </div>

      <div class="field">
        <label for="status">Статус</label>
        <Dropdown id="status" v-model="formData.status" :options="['ACTIVE', 'ON_HOLD']" class="w-full"
          :optionLabel="(option) => option === 'ACTIVE' ? 'Активний' : 'Призупинений'" />
      </div>
    </div>

    <template #footer>
      <Button label="Відміна" icon="pi pi-times" class="p-button-text" @click="handleHide" />
      <Button label="Зберегти" icon="pi pi-check" @click="handleSave" :disabled="!formData.name" />
    </template>
  </Dialog>
</template>

<style scoped>
.form-container {
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
</style>
