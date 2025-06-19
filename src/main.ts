import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import router from './router';

// PrimeVue components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import AutoComplete from 'primevue/autocomplete';
import InputNumber from 'primevue/inputnumber';

// Styles
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './style.css';

const app = createApp(App);

// Use plugins
app.use(createPinia());
app.use(router);
app.use(PrimeVue);
app.use(ToastService);

// Register PrimeVue components
app.component('Button', Button);
app.component('InputText', InputText);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Dialog', Dialog);
app.component('Toast', Toast);
app.component('Card', Card);
app.component('Chart', Chart);
app.component('TabView', TabView);
app.component('TabPanel', TabPanel);
app.component('Calendar', Calendar);
app.component('Dropdown', Dropdown);
app.component('Tag', Tag);
app.component('AutoComplete', AutoComplete);
app.component('InputNumber', InputNumber);

app.mount('#app');
