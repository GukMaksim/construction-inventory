import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SuppliersView from '../views/SuppliersView.vue';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/suppliers',
			name: 'suppliers',
			component: SuppliersView,
		},
		{
			path: '/inventory',
			name: 'inventory',
			component: () => import('../views/InventoryView.vue'),
		},
		{
			path: '/construction-sites',
			name: 'construction-sites',
			component: () => import('../views/ConstructionSitesView.vue'),
		},
		{
			path: '/reports',
			name: 'reports',
			component: () => import('../views/ReportsView.vue'),
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('../views/LoginView.vue'),
		},
	],
});

export default router;
