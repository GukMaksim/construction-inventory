<template>
  <div class="login-view">
    <form @submit.prevent="onLogin">
      <h2>Вход</h2>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <div class="field">
        <label for="password">Пароль</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <button type="submit" :disabled="loading">Войти</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const router = useRouter();

const onLogin = async () => {
  try {
    await auth.login(email.value, password.value);
    router.push('/'); // после входа на главную
  } catch (e) {
    // ошибка уже обработана в store
  }
};
</script>

<style scoped>
.login-view {
  max-width: 400px;
  margin: 80px auto;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
.field {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
button:disabled {
  background: #aaa;
}
.error {
  color: #d00;
  margin-top: 1rem;
  text-align: center;
}
</style>
