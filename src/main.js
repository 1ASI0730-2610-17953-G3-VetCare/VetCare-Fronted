import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import 'primeicons/primeicons.css'

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { createPinia } from 'pinia';
import router from './router.js';
import i18n from './i18n.js';

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            cssLayer: {
                name: 'primevue',
                order: 'tailwind-base, primevue, tailwind-utilities'
            }
        }
    }
});

const pinia = createPinia();
app.use(pinia);

import { useIamStore } from './iam/application/iam.store.js';
const iamStore = useIamStore(pinia);
iamStore.restoreSession();

app.use(router);
app.use(i18n);

app.mount('#app')
