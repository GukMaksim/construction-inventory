<template>
  <div class="app-container">
    <header class="header">
      <div class="logo">
        <h1>Будівельний облік</h1>
      </div>
      <nav class="navigation">
        <router-link to="/">Головна</router-link>
        <router-link to="/suppliers">Постачальники</router-link>
        <router-link to="/inventory">Склад</router-link>
        <router-link to="/construction-sites">Об'єкти</router-link>
        <router-link to="/reports">Звіти</router-link>
      </nav>
      <div class="user-info">
        <span class="user-name">Адміністратор</span>
        <Button icon="pi pi-user" class="p-button-text" />
      </div>
    </header>

    <main class="main-content">
      <Toast />
      <router-view />
    </main>

    <footer class="footer">
      <p>&copy; 2025 Будівельний облік. Всі права захищені.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Component logic will be added here
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
}

.navigation {
  display: flex;
  gap: 1rem;
}

.navigation a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.navigation a:hover,
.navigation a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: var(--surface-ground);
}

.footer {
  background-color: var(--surface-section);
  padding: 1rem;
  text-align: center;
}
</style>
