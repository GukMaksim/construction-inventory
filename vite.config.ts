import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		port: 3000,
		strictPort: true,
		host: true,
		proxy: {
			'/api': 'http://localhost:3001', // Прокси для API сервера
		},
	},
});
