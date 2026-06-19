<script setup>
import { ref, reactive, computed, watch, onActivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ConsultationService } from '../../infrastructure/services/consultation.service';
import { usePatientStore } from '../../application/store/patient.store.js';
import { useConsultationStore } from '../../application/store/consultation.store.js';
import { BaseApi } from '@/shared/infrastructure/base-api';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';

const consultationService = new ConsultationService();
const patientStore = usePatientStore();
const consultationStore = useConsultationStore();
const { patients } = storeToRefs(patientStore);
const { consultations: consultas } = storeToRefs(consultationStore);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const searchQuery = ref('');
const statusFilter = ref('');
const dateFilter = ref('');

const currentPage = ref(1);
const itemsPerPage = ref(5);

watch([searchQuery, statusFilter, dateFilter], () => {
  currentPage.value = 1;
});

const showModal = ref(false);
const isSaving = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const editingId = ref(null);
const showViewModal = ref(false);
const viewedConsulta = ref(null);
const isPrinting = ref(false);
const printId = ref(null);

const getDefaultForm = () => ({
  patientId: '',
  patientName: '',
  clientName: '',
  type: '',
  status: '',
  diagnosis: '',
  notes: '',
  date: '',
  time: '',
  vitalTemp: '',
  vitalHR: '',
  vitalWeight: '',
  vitalCondition: '',
  items: []
});
const form = reactive(getDefaultForm());

const inventoryProducts = ref([]);
const fetchInventory = async () => {
  try {
    const response = await BaseApi.get('/products');
    inventoryProducts.value = response.data;
  } catch (e) {
    console.error("Error fetching inventory", e);
  }
};

const addItemToForm = () => {
  form.items.push({ product: null, quantity: 1 });
};
const removeItemFromForm = (index) => {
  form.items.splice(index, 1);
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateFilter.value = '';
};

const isLoading = ref(false);

const fetchConsultations = async (force = false) => {
  try {
    await consultationStore.fetchConsultations({ force });
  } catch (error) {
    displayToast('Error al cargar consultas', 'error');
  }
};

const syncClientFromPatient = (patientId) => {
  const patient = patients.value.find((item) => String(item.id) === String(patientId));
  if (patient) {
    form.patientName = patient.name;
    form.clientName = patient.owner ?? '';
  }
};

watch(() => form.patientId, (patientId) => {
  if (patientId) syncClientFromPatient(patientId);
});

const getStatusBadgeClass = (status) => {
  return `status-badge status-${status}`;
};

const getStatusLabel = (status) => {
  return t(`clinicManagement.consultations.status.${status}`);
};

const getStatusIcon = (status) => {
  const icons = {
    completada: 'pi pi-check-circle',
    en_proceso: 'pi pi-circle-fill',
    pendiente: 'pi pi-clock',
    critico: 'pi pi-exclamation-triangle',
    cancelada: 'pi pi-times-circle',
    urgente: 'pi pi-bolt'
  };
  return icons[status] || '';
};

const getAvatarClass = (breed) => {
  const normalized = breed.toLowerCase().replace(/\s+/g, '_');
  if (normalized.includes('golden')) return 'avatar-golden';
  if (normalized.includes('persa')) return 'avatar-persa';
  if (normalized.includes('bulldog')) return 'avatar-bulldog';
  if (normalized.includes('labrador')) return 'avatar-labrador';
  if (normalized.includes('siamés') || normalized.includes('siames')) return 'avatar-siames';
  return 'avatar-default';
};

const openModal = (consulta = null) => { 
  if (consulta && consulta.id) {
    editingId.value = consulta.originalId;
    form.patientId = consulta.patientId ?? '';
    form.patientName = consulta.patient.name;
    form.clientName = consulta.client.name;
    form.type = consulta.type;
    form.status = consulta.status;
    form.diagnosis = consulta.diagnosis;
    form.notes = consulta.notes || '';
    form.vitalTemp = consulta.vitals?.temp || '';
    form.vitalHR = consulta.vitals?.hr || '';
    form.vitalWeight = consulta.vitals?.weight || '';
    form.vitalCondition = consulta.vitals?.condition || '';
    form.date = '';
    form.time = '';
  } else {
    editingId.value = null;
    Object.assign(form, getDefaultForm()); 
  }
  Object.keys(formErrors).forEach(k => delete formErrors[k]); 
  showModal.value = true; 
};
const closeModal = () => { showModal.value = false; };

const openViewModal = (consulta) => {
  viewedConsulta.value = consulta;
  showViewModal.value = true;
};
const closeViewModal = () => {
  showViewModal.value = false;
  viewedConsulta.value = null;
};

const showPaymentModal = ref(false);
const currentTicket = ref(null);
const paymentMethod = ref('Efectivo');
const pendingConsultaId = ref(null);

const closeConsulta = async (consulta) => {
  try {
    if (!consulta.originalId) return;
    await consultationService.completeConsultation(consulta.originalId);
    const idx = consultas.value.findIndex(c => c.id === consulta.id);
    if (idx !== -1) {
      consultas.value[idx] = { ...consultas.value[idx], status: 'completada', rawStatus: 'completada' };
    }
    displayToast(t('clinicManagement.consultations.closeSuccess'), 'success');
  } catch (e) {
    displayToast(t('clinicManagement.consultations.closeError'), 'error');
  }
};

const openPaymentModalForConsultation = async (consultationId, displayId) => {
  const ticketRes = await BaseApi.get(`/tickets/consultation/${consultationId}`);
  currentTicket.value = ticketRes.data;
  pendingConsultaId.value = displayId;
  paymentMethod.value = 'Efectivo';
  showPaymentModal.value = true;
};

const processPayment = async () => {
  if (!currentTicket.value) return;
  try {
    await BaseApi.post(`/tickets/${currentTicket.value.id}/pay`, { paymentMethod: paymentMethod.value });
    displayToast(t('clinicManagement.consultations.payment.success'), 'success');
    showPaymentModal.value = false;
    currentTicket.value = null;
    pendingConsultaId.value = null;
    await fetchConsultations(true);
  } catch (e) {
    displayToast(t('clinicManagement.consultations.payment.error'), 'error');
  }
};

const cancelPaymentModal = () => {
  showPaymentModal.value = false;
  currentTicket.value = null;
  pendingConsultaId.value = null;
  displayToast(t('clinicManagement.consultations.payment.pending'), 'info');
};

const printConsulta = async (consulta) => {
  if (isPrinting.value) return;
  isPrinting.value = true;
  printId.value = consulta.id;
  displayToast(`Generando PDF para ${consulta.id}...`, 'info');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const printWindow = window.open('', '_blank');
  
  const statusFormatted = getStatusLabel(consulta.status).toUpperCase();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Consulta ${consulta.id} - VetCare</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; color: #1E293B; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #10B981; letter-spacing: -0.5px; }
        .doc-title { text-align: right; }
        .doc-title-text { font-size: 22px; color: #334155; font-weight: 600; margin-bottom: 4px; }
        .doc-id { font-size: 15px; color: #64748B; font-weight: 500; }
        .section { margin-bottom: 35px; }
        .section-title { font-size: 18px; color: #059669; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 16px; font-weight: 600; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .label { font-weight: 700; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 500; color: #0F172A; }
        .diagnosis-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; margin-top: 10px; font-size: 15px; color: #334155; font-style: italic; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 30px; }
        .signature-line { width: 250px; border-top: 1px solid #CBD5E1; margin: 40px auto 10px auto; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">VetCare+</div>
        <div class="doc-title">
          <div class="doc-title-text">Historial Clínico</div>
          <div class="doc-id">Consulta ID: ${consulta.id}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Información del Paciente</div>
        <div class="grid">
          <div>
            <div class="label">Nombre del Paciente</div>
            <div class="value">${consulta.patient.name}</div>
          </div>
          <div>
            <div class="label">Raza / Especie</div>
            <div class="value">${consulta.patient.breed}</div>
          </div>
          <div>
            <div class="label">Propietario / Cliente</div>
            <div class="value">${consulta.client.name}</div>
          </div>
          <div>
            <div class="label">Teléfono de Contacto</div>
            <div class="value">${consulta.client.phone}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Detalles de la Atención Médica</div>
        <div class="grid">
          <div>
            <div class="label">Tipo de Consulta</div>
            <div class="value">${consulta.type}</div>
          </div>
          <div>
            <div class="label">Fecha y Hora Registrada</div>
            <div class="value">${consulta.date} - ${consulta.time}</div>
          </div>
          <div>
            <div class="label">Estado de la Consulta</div>
            <div class="value">${statusFormatted}</div>
          </div>
        </div>
        
        <div style="margin-top: 24px;">
          <div class="label">Motivo de la Consulta / Diagnóstico Inicial</div>
          <div class="diagnosis-box">
            ${consulta.diagnosis}
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="signature-line"></div>
        <div>Firma y Sello del Médico Veterinario Tratante</div>
        <div style="margin-top: 20px;">
          Documento generado por el sistema VetCare el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();


          }, 500);
        }
      <\/script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  displayToast('Documento enviado a impresión', 'success');
  isPrinting.value = false;
  printId.value = null;
};

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.patientId) formErrors.patientId = true;
  if (!form.type) formErrors.type = true;
  if (!form.status) formErrors.status = true;
  if (!form.date) formErrors.date = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const filteredConsultas = computed(() => {
  return consultas.value.filter(consulta => {
    let match = true;
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const patientMatch = consulta.patient.name.toLowerCase().includes(q);
      const clientMatch = consulta.client.name.toLowerCase().includes(q);
      const idMatch = consulta.id.toLowerCase().includes(q);
      const typeMatch = consulta.type.toLowerCase().includes(q);
      match = match && (patientMatch || clientMatch || idMatch || typeMatch);
    }
    
    if (statusFilter.value) {
      match = match && (consulta.status === statusFilter.value);
    }
    
    if (dateFilter.value) {
      const formattedFilterDate = formatDate(dateFilter.value);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      
      let mappedConsultaDate = consulta.date;
      if (mappedConsultaDate === 'Hoy') mappedConsultaDate = formatDate(today.toISOString().split('T')[0]);
      if (mappedConsultaDate === 'Ayer') mappedConsultaDate = formatDate(yesterday.toISOString().split('T')[0]);
      
      match = match && (mappedConsultaDate === formattedFilterDate);
    }
    
    return match;
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredConsultas.value.length / itemsPerPage.value) || 1;
});

const paginatedConsultas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredConsultas.value.slice(start, end);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
  }
  return pages;
});

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  
  try {
    const payload = {
      patientId: Number(form.patientId),
      doctorName: 'Dr. Arturo',
      type: form.type,
      status: form.status,
      subjective: form.notes,
      objective: null,
      analysis: form.diagnosis,
      plan: form.notes,
      temperature: form.vitalTemp ? parseFloat(form.vitalTemp) : null,
      heartRate: form.vitalHR ? parseInt(form.vitalHR) : null,
      weight: form.vitalWeight ? parseFloat(form.vitalWeight) : null,
      bodyCondition: form.vitalCondition ? parseInt(form.vitalCondition) : null,
      date: form.date + (form.time ? `T${form.time}:00Z` : 'T00:00:00Z'),
      items: form.items.filter(i => i.product).map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.product.price)
      }))
    };

    if (editingId.value) {
      displayToast('Consulta actualizada exitosamente', 'success');
    } else {
      const created = await consultationService.createConsultation(payload);
      closeModal();
      await fetchConsultations(true);
      try {
        await openPaymentModalForConsultation(created.originalId, created.id);
      } catch (ticketError) {
        displayToast(t('clinicManagement.consultations.payment.ticketError'), 'error');
      }
      isSaving.value = false;
      return;
    }
    
    await fetchConsultations(true);
    closeModal();
  } catch (e) {
    displayToast(t('clinicManagement.consultations.registerForm.errorMessage'), 'error');
  } finally {
    isSaving.value = false;
  }
};

const loadInitialData = async () => {
  const needsLoader = consultas.value.length === 0 || patients.value.length === 0;
  if (needsLoader) isLoading.value = true;
  try {
    await Promise.all([
      fetchConsultations(),
      patientStore.fetchPatients(),
      fetchInventory()
    ]);
  } finally {
    isLoading.value = false;
  }
};

const handleRouteQuery = () => {
  if (route.query.new === 'true') {
    openModal();
    if (route.query.patientId) {
      form.patientId = String(route.query.patientId);
      syncClientFromPatient(form.patientId);
    }
    router.replace({ query: {} });
  }
};

onActivated(async () => {
  await loadInitialData();
  handleRouteQuery();
});
</script>

<template>
  <div class="consultas-view">
    
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : (toastType === 'info' ? 'pi pi-info-circle' : 'pi pi-times-circle')"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-calendar-plus" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('clinicManagement.consultations.title') }}</h1>
          <p class="view-description">{{ t('clinicManagement.consultations.description') }}</p>
        </div>
      </div>
      <button type="button" class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.consultations.register') }}
      </button>
    </div>

    <div class="consultas-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.consultations.recentTitle') }}</h2>
          <span class="results-chip">
            {{ t('clinicManagement.consultations.resultsCount', { count: filteredConsultas.length }) }}
          </span>
        </div>
      </div>

      <div class="filters-panel">
        <div class="search-input-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('clinicManagement.consultations.search')"
            class="search-input"
          />
        </div>

        <div class="filters-group">
          <div class="filter-select-wrap">
            <select v-model="statusFilter" class="select-filter">
              <option value="">{{ t('clinicManagement.consultations.allStatuses') }}</option>
              <option value="completada">{{ t('clinicManagement.consultations.status.completada') }}</option>
              <option value="en_proceso">{{ t('clinicManagement.consultations.status.en_proceso') }}</option>
              <option value="pendiente">{{ t('clinicManagement.consultations.status.pendiente') }}</option>
              <option value="critico">{{ t('clinicManagement.consultations.status.critico') }}</option>
            </select>
            <i class="pi pi-chevron-down filter-chevron" aria-hidden="true"></i>
          </div>

          <div class="date-input-wrapper">
            <i class="pi pi-calendar date-icon"></i>
            <input
              type="date"
              v-model="dateFilter"
              class="date-input"
            />
          </div>

          <button type="button" @click="resetFilters" class="reset-button">
            <i class="pi pi-filter-slash"></i>
            {{ t('clinicManagement.consultations.clearFilters') }}
          </button>
        </div>
      </div>

      <div class="table-container">
        <PageViewLoading
          v-if="isLoading"
          variant="table"
          :columns="8"
          :table-rows="5"
          :message="t('clinicManagement.consultations.loading')"
        />
        <table v-else-if="filteredConsultas.length > 0" class="consultas-table">
          <thead>
            <tr>
              <th>{{ t('clinicManagement.consultations.columns.id') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.patient') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.client') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.type') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.diagnosis') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.date') }}</th>
              <th>{{ t('clinicManagement.consultations.columns.status') }}</th>
              <th class="actions-header">{{ t('clinicManagement.consultations.columns.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consulta in paginatedConsultas" :key="consulta.id">
              <td :data-label="t('clinicManagement.consultations.columns.id')" class="cell-id">{{ consulta.id }}</td>
              <td :data-label="t('clinicManagement.consultations.columns.patient')">
                <div class="patient-cell">
                  <img
                    :src="consulta.patient.image"
                    :alt="consulta.patient.name"
                    class="pet-avatar-img"
                  />
                  <div class="patient-info">
                    <span class="patient-name">{{ consulta.patient.name }}</span>
                    <span class="patient-breed">{{ consulta.patient.breed }}</span>
                  </div>
                </div>
              </td>
              <td :data-label="t('clinicManagement.consultations.columns.client')">
                <div class="client-cell">
                  <span class="client-name">{{ consulta.client.name }}</span>
                  <span class="client-phone">{{ consulta.client.phone }}</span>
                </div>
              </td>
              <td :data-label="t('clinicManagement.consultations.columns.type')" class="cell-type">{{ consulta.type }}</td>
              <td :data-label="t('clinicManagement.consultations.columns.diagnosis')" class="cell-diagnosis">{{ consulta.diagnosis }}</td>
              <td :data-label="t('clinicManagement.consultations.columns.date')">
                <div class="date-cell">
                  <span class="date-primary">{{ consulta.date }}</span>
                  <span class="date-secondary">{{ consulta.time }}</span>
                </div>
              </td>
              <td :data-label="t('clinicManagement.consultations.columns.status')">
                <div class="status-badge" :class="getStatusBadgeClass(consulta.status)">
                  <i :class="getStatusIcon(consulta.status)"></i>
                  {{ getStatusLabel(consulta.status) }}
                </div>
              </td>
              <td :data-label="t('clinicManagement.consultations.columns.actions')" class="actions-cell">
                <button type="button" class="action-btn action-view" :title="t('clinicManagement.consultations.actions.viewDetail')" @click="openViewModal(consulta)">
                  <span class="action-icon-wrap"><i class="pi pi-eye"></i></span>
                </button>
                <button type="button" class="action-btn action-edit" :title="t('clinicManagement.consultations.actions.edit')" @click="openModal(consulta)" :disabled="consulta.status === 'completada'">
                  <span class="action-icon-wrap"><i class="pi pi-pencil"></i></span>
                </button>
                <button type="button" class="action-btn action-print" :title="t('clinicManagement.consultations.actions.print')" @click="printConsulta(consulta)" :disabled="isPrinting && printId === consulta.id">
                  <span class="action-icon-wrap">
                    <i :class="isPrinting && printId === consulta.id ? 'pi pi-spin pi-spinner' : 'pi pi-print'"></i>
                  </span>
                </button>
                <button
                  v-if="consulta.status !== 'completada'"
                  type="button"
                  class="action-btn action-close"
                  :title="t('clinicManagement.consultations.actions.close')"
                  @click="closeConsulta(consulta)"
                >
                  <span class="action-icon-wrap"><i class="pi pi-lock-open"></i></span>
                </button>
                <span v-else class="closed-indicator" :title="t('clinicManagement.consultations.actions.closedTooltip')">
                  <span class="action-icon-wrap closed"><i class="pi pi-lock"></i></span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar" v-if="!isLoading && filteredConsultas.length > 0">
        <div class="results-summary">
          {{ t('clinicManagement.consultations.pagination.showing', { 
            from: (currentPage - 1) * itemsPerPage + 1, 
            to: Math.min(currentPage * itemsPerPage, filteredConsultas.length), 
            total: filteredConsultas.length 
          }) }}
        </div>
        <div class="pagination-controls">
          <button 
            class="pagination-nav-btn" 
            @click="currentPage > 1 && currentPage--" 
            :disabled="currentPage === 1"
            :class="{ 'disabled-btn': currentPage === 1 }"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          
          <template v-for="(page, index) in visiblePages" :key="index">
            <span v-if="page === '...'" class="pagination-dots">…</span>
            <button 
              v-else 
              class="pagination-btn" 
              :class="{ active: currentPage === page }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </template>
          
          <button 
            class="pagination-nav-btn" 
            @click="currentPage < totalPages && currentPage++" 
            :disabled="currentPage === totalPages"
            :class="{ 'disabled-btn': currentPage === totalPages }"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon-wrap">
          <i class="pi pi-inbox"></i>
        </div>
        <h3 class="empty-title">{{ t('clinicManagement.consultations.emptyState.title') }}</h3>
        <p class="empty-description">{{ t('clinicManagement.consultations.emptyState.description') }}</p>
        <button type="button" class="btn-primary empty-action" @click="openModal">
          <i class="pi pi-plus"></i>
          {{ t('clinicManagement.consultations.register') }}
        </button>
      </div>
    </div>

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container register-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-briefcase" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ editingId ? t('clinicManagement.consultations.registerForm.editTitle', { id: editingId }) : t('clinicManagement.consultations.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.consultations.registerForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form" @submit.prevent="submitForm">
            <div class="register-form-content">
            <section class="register-panel">
              <h3 class="register-panel-title">
                <span class="register-panel-icon register-panel-icon-info"><i class="pi pi-users" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.registerForm.patientInfo') }}
              </h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.patientId }">
                  <label>{{ t('clinicManagement.consultations.registerForm.patientName') }} *</label>
                  <select v-model="form.patientId">
                    <option value="">{{ t('clinicManagement.consultations.registerForm.patientNamePlaceholder') }}</option>
                    <option v-for="patient in patients" :key="patient.id" :value="patient.id">
                      {{ patient.name }} ({{ patient.code }})
                    </option>
                  </select>
                  <span v-if="formErrors.patientId" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.clientName') }} *</label>
                  <input type="text" v-model="form.clientName" :placeholder="t('clinicManagement.consultations.registerForm.clientNamePlaceholder')" readonly />
                </div>
              </div>
            </section>

            <section class="register-panel">
              <h3 class="register-panel-title">
                <span class="register-panel-icon"><i class="pi pi-folder-open" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.registerForm.consultationInfo') }}
              </h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.type }">
                  <label>{{ t('clinicManagement.consultations.registerForm.type') }} *</label>
                  <select v-model="form.type">
                    <option value="">{{ t('clinicManagement.consultations.registerForm.typePlaceholder') }}</option>
                    <option :value="t('clinicManagement.consultations.registerForm.typeGeneral')">{{ t('clinicManagement.consultations.registerForm.typeGeneral') }}</option>
                    <option :value="t('clinicManagement.consultations.registerForm.typeVaccination')">{{ t('clinicManagement.consultations.registerForm.typeVaccination') }}</option>
                    <option :value="t('clinicManagement.consultations.registerForm.typeEmergency')">{{ t('clinicManagement.consultations.registerForm.typeEmergency') }}</option>
                    <option :value="t('clinicManagement.consultations.registerForm.typeCheckup')">{{ t('clinicManagement.consultations.registerForm.typeCheckup') }}</option>
                  </select>
                  <span v-if="formErrors.type" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.status }">
                  <label>{{ t('clinicManagement.consultations.registerForm.statusLabel') }} *</label>
                  <select v-model="form.status">
                    <option value="">{{ t('clinicManagement.consultations.registerForm.statusPlaceholder') }}</option>
                    <option value="pendiente">{{ t('clinicManagement.consultations.status.pendiente') }}</option>
                    <option value="en_proceso">{{ t('clinicManagement.consultations.status.en_proceso') }}</option>
                    <option value="completada">{{ t('clinicManagement.consultations.status.completada') }}</option>
                    <option value="urgente">{{ t('clinicManagement.consultations.status.urgente') }}</option>
                    <option value="critico">{{ t('clinicManagement.consultations.status.critico') }}</option>
                  </select>
                  <span v-if="formErrors.status" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
                
                <div class="form-group span-full">
                  <label>{{ t('clinicManagement.consultations.registerForm.diagnosis') }}</label>
                  <textarea v-model="form.diagnosis" :placeholder="t('clinicManagement.consultations.registerForm.diagnosisPlaceholder')" rows="2"></textarea>
                </div>

                <div class="form-group span-full">
                  <label>{{ t('clinicManagement.consultations.registerForm.notes') }}</label>
                  <textarea v-model="form.notes" :placeholder="t('clinicManagement.consultations.registerForm.notesPlaceholder')" rows="3"></textarea>
                </div>

                <div class="form-group" :class="{ 'has-error': formErrors.date }">
                  <label>{{ t('clinicManagement.consultations.registerForm.date') }} *</label>
                  <input type="date" v-model="form.date" />
                  <span v-if="formErrors.date" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.time') }}</label>
                  <input type="time" v-model="form.time" />
                </div>
              </div>
            </section>

            <section class="register-panel">
              <h3 class="register-panel-title">
                <span class="register-panel-icon register-panel-icon-success"><i class="pi pi-heart-fill" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.registerForm.vitalsTitle') }}
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.vitalTemp') }}</label>
                  <input type="number" step="0.1" v-model="form.vitalTemp" :placeholder="t('clinicManagement.consultations.registerForm.vitalTempPlaceholder')" />
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.vitalHR') }}</label>
                  <input type="number" v-model="form.vitalHR" :placeholder="t('clinicManagement.consultations.registerForm.vitalHRPlaceholder')" />
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.vitalWeight') }}</label>
                  <input type="number" step="0.1" v-model="form.vitalWeight" :placeholder="t('clinicManagement.consultations.registerForm.vitalWeightPlaceholder')" />
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.consultations.registerForm.vitalCondition') }}</label>
                  <select v-model="form.vitalCondition">
                    <option value="">{{ t('clinicManagement.consultations.registerForm.vitalConditionPlaceholder') }}</option>
                    <option value="1">1 – Muy delgado</option>
                    <option value="2">2 – Delgado</option>
                    <option value="3">3 – Ideal</option>
                    <option value="4">4 – Sobrepeso</option>
                    <option value="5">5 – Obeso</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="register-panel">
              <h3 class="register-panel-title">
                <span class="register-panel-icon register-panel-icon-warning"><i class="pi pi-box" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.registerForm.suppliesTitle') }}
              </h3>
              <div class="items-container">
                <div v-for="(item, index) in form.items" :key="index" class="supply-row">
                  <select v-model="item.product" class="supply-select">
                    <option :value="null">{{ t('clinicManagement.consultations.registerForm.suppliesSelect') }}</option>
                    <option v-for="p in inventoryProducts" :key="p.id" :value="p">{{ p.name }} (Stock: {{ p.stock }}) - {{ p.price }} PEN</option>
                  </select>
                  <input type="number" v-model="item.quantity" min="1" class="supply-qty" :placeholder="t('clinicManagement.consultations.registerForm.suppliesQty')" />
                  <button type="button" class="supply-remove-btn" @click="removeItemFromForm(index)">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
                <button type="button" class="supply-add-btn" @click="addItemToForm">
                  <i class="pi pi-plus"></i> {{ t('clinicManagement.consultations.registerForm.suppliesAdd') }}
                </button>
              </div>
            </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('clinicManagement.consultations.registerForm.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? t('clinicManagement.consultations.registerForm.saving') : (editingId ? t('clinicManagement.consultations.registerForm.saveChanges') : t('clinicManagement.consultations.registerForm.save')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    
    <Transition name="modal">
      <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
        <div class="modal-container view-modal">
          <div class="modal-header">
            <div class="modal-header-icon icon-success"><i class="pi pi-file" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.consultations.viewDetail.title', { id: viewedConsulta?.id }) }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.consultations.viewDetail.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeViewModal"><i class="pi pi-times"></i></button>
          </div>

          <div class="detail-form-content" v-if="viewedConsulta">
            <section class="detail-panel detail-panel-info">
              <h3 class="detail-panel-title">
                <span class="detail-panel-icon detail-panel-icon-info"><i class="pi pi-user" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.viewDetail.patientSection') }}
              </h3>
              <div class="detail-fields-grid">
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.patient') }}</span>
                  <strong class="detail-field-value">{{ viewedConsulta.patient.name }} ({{ viewedConsulta.patient.breed }})</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.client') }}</span>
                  <strong class="detail-field-value">{{ viewedConsulta.client.name }}</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.phone') }}</span>
                  <strong class="detail-field-value">{{ viewedConsulta.client.phone }}</strong>
                </div>
              </div>
            </section>

            <section class="detail-panel detail-panel-primary">
              <h3 class="detail-panel-title">
                <span class="detail-panel-icon"><i class="pi pi-folder-open" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.viewDetail.medicalSection') }}
              </h3>
              <div class="detail-fields-grid">
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.type') }}</span>
                  <strong class="detail-field-value">{{ viewedConsulta.type }}</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.date') }}</span>
                  <strong class="detail-field-value">{{ viewedConsulta.date }} {{ viewedConsulta.time }}</strong>
                </div>
                <div class="detail-field span-full">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.viewDetail.status') }}</span>
                  <div class="status-badge" :class="getStatusBadgeClass(viewedConsulta.status)">
                    <i :class="getStatusIcon(viewedConsulta.status)"></i> {{ getStatusLabel(viewedConsulta.status) }}
                  </div>
                </div>
                <div class="detail-field span-full">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.registerForm.diagnosis') }}</span>
                  <div class="diagnosis-box">{{ viewedConsulta.diagnosis }}</div>
                </div>
                <div v-if="viewedConsulta.notes" class="detail-field span-full">
                  <span class="detail-field-label">{{ t('clinicManagement.consultations.registerForm.notes') }}</span>
                  <div class="notes-box">{{ viewedConsulta.notes }}</div>
                </div>
              </div>
            </section>

            <section v-if="viewedConsulta.vitals" class="detail-panel detail-panel-success">
              <h3 class="detail-panel-title">
                <span class="detail-panel-icon detail-panel-icon-success"><i class="pi pi-heart-fill" aria-hidden="true"></i></span>
                {{ t('clinicManagement.consultations.registerForm.vitalsTitle') }}
              </h3>
              <div class="vitals-detail-grid">
                <div class="vital-detail-chip">
                  <span class="vital-detail-label">{{ t('clinicManagement.consultations.registerForm.vitalTemp') }}</span>
                  <span class="vital-detail-value">{{ viewedConsulta.vitals.temp }} °C</span>
                </div>
                <div class="vital-detail-chip">
                  <span class="vital-detail-label">{{ t('clinicManagement.consultations.registerForm.vitalHR') }}</span>
                  <span class="vital-detail-value">{{ viewedConsulta.vitals.hr }} lpm</span>
                </div>
                <div class="vital-detail-chip">
                  <span class="vital-detail-label">{{ t('clinicManagement.consultations.registerForm.vitalWeight') }}</span>
                  <span class="vital-detail-value">{{ viewedConsulta.vitals.weight }} kg</span>
                </div>
                <div class="vital-detail-chip">
                  <span class="vital-detail-label">{{ t('clinicManagement.consultations.registerForm.vitalCondition') }}</span>
                  <span class="vital-detail-value">{{ viewedConsulta.vitals.condition }}/5</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showPaymentModal" class="modal-overlay" @click.self="cancelPaymentModal">
        <div class="modal-container payment-modal">
          <div class="modal-header">
            <div class="modal-header-icon icon-info"><i class="pi pi-money-bill"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.consultations.payment.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.consultations.payment.subtitle', { id: currentTicket?.id }) }}</p>
            </div>
            <button type="button" class="modal-close" @click="cancelPaymentModal"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body" v-if="currentTicket">
            <div class="payment-summary">
              <div class="payment-row">
                <span>{{ t('clinicManagement.consultations.payment.consultationFee') }}</span>
                <span class="payment-amount">S/ {{ currentTicket.consultationBasePrice.toFixed(2) }}</span>
              </div>
              <div v-for="item in currentTicket.items" :key="item.id" class="payment-row payment-row--item">
                <span>{{ item.quantity }}x {{ item.productName }}</span>
                <span>S/ {{ (item.quantity * item.unitPrice).toFixed(2) }}</span>
              </div>
              <div class="payment-divider"></div>
              <div class="payment-row payment-row--total">
                <strong>{{ t('clinicManagement.consultations.payment.total') }}</strong>
                <strong class="payment-total">S/ {{ currentTicket.totalAmount.toFixed(2) }}</strong>
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('clinicManagement.consultations.payment.methodLabel') }}</label>
              <div class="payment-methods">
                <button type="button" class="payment-method-btn" :class="{ active: paymentMethod === 'Efectivo' }" @click="paymentMethod = 'Efectivo'">Efectivo</button>
                <button type="button" class="payment-method-btn" :class="{ active: paymentMethod === 'Tarjeta' }" @click="paymentMethod = 'Tarjeta'">Tarjeta</button>
              </div>
              <div class="payment-methods">
                <button type="button" class="payment-method-btn" :class="{ active: paymentMethod === 'Yape' }" @click="paymentMethod = 'Yape'">Yape</button>
                <button type="button" class="payment-method-btn" :class="{ active: paymentMethod === 'Banca' }" @click="paymentMethod = 'Banca'">Banca</button>
              </div>
            </div>
            
            <div class="modal-actions payment-actions">
              <button type="button" class="btn-cancel" @click="cancelPaymentModal">{{ t('clinicManagement.consultations.payment.cancel') }}</button>
              <button type="button" class="btn-submit btn-submit-success" @click="processPayment">
                <i class="pi pi-check"></i> {{ t('clinicManagement.consultations.payment.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.consultas-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 18px 20px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  color: var(--color-primary-main);
  font-size: 20px;
}

.view-title {
  font-size: var(--font-title-size);
  line-height: 1.3;
  font-weight: var(--font-title-weight);
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.view-description {
  font-size: var(--font-subtitle-size);
  line-height: 1.4;
  font-weight: var(--font-subtitle-weight);
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-primary {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: var(--radius-standard);
  padding: 10px 20px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 24%, transparent);
}

.consultas-card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.card-header {
  padding: 18px 22px 0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-title {
  font-size: var(--font-cardTitle-size);
  line-height: 1.4;
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.results-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.filters-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 22px 0;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-background-main) 65%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  flex-wrap: wrap;
  gap: 12px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  padding: 10px 12px 10px 36px;
  color: var(--color-text-primary);
  font-size: var(--font-body-main-size);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-chevron {
  position: absolute;
  right: 12px;
  color: var(--color-text-muted);
  font-size: 11px;
  pointer-events: none;
}

.select-filter {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  padding: 10px 32px 10px 12px;
  color: var(--color-text-primary);
  font-size: var(--font-body-main-size);
  min-width: 168px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  appearance: none;
}

.select-filter:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  pointer-events: none;
}

.date-input {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  padding: 10px 12px 10px 36px;
  color: var(--color-text-primary);
  font-size: var(--font-body-main-size);
  width: 168px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.date-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  cursor: pointer;
}

.date-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.reset-button {
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  padding: 10px 14px;
  font-size: var(--font-body-main-size);
  font-weight: var(--font-body-main-weight);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.reset-button:hover {
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
  color: var(--color-text-primary);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
}

.reset-button i {
  font-size: 13px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  padding: 16px 22px 0;
}

.consultas-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
}

.consultas-table th {
  background: color-mix(in srgb, var(--color-background-main) 80%, var(--color-background-surface));
  padding: 12px 16px;
  font-size: var(--font-body-tag-size);
  line-height: 1.3;
  font-weight: var(--font-body-tag-weight);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border-light);
}

.consultas-table th:first-child {
  border-radius: 10px 0 0 0;
}

.consultas-table th:last-child {
  border-radius: 0 10px 0 0;
}

.actions-header {
  text-align: center;
}

.consultas-table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.2s ease;
}

.consultas-table tbody tr:hover {
  background: color-mix(in srgb, var(--color-primary-main) 4%, var(--color-background-surface));
}

.consultas-table tbody tr:last-child {
  border-bottom: none;
}

.consultas-table td {
  padding: 14px 16px;
  vertical-align: middle;
}

.cell-id {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-accent);
  font-variant-numeric: tabular-nums;
}

.patient-cell,
.client-cell,
.date-cell {
  display: flex;
  flex-direction: column;
}

.patient-cell {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.patient-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.patient-breed {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.pet-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  flex-shrink: 0;
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px var(--color-border-light);
}

.pet-avatar-img {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px var(--color-border-light);
}

.avatar-golden { background: color-mix(in srgb, var(--color-status-warning-indicator) 18%, white); color: var(--color-status-warning-text); }
.avatar-persa { background: color-mix(in srgb, var(--color-primary-main) 14%, white); color: var(--color-primary-main); }
.avatar-bulldog { background: color-mix(in srgb, var(--color-status-danger-indicator) 14%, white); color: var(--color-status-danger-text); }
.avatar-labrador { background: color-mix(in srgb, var(--color-status-success-indicator) 16%, white); color: var(--color-status-success-text); }
.avatar-siames { background: var(--color-status-warning-bg); color: var(--color-status-warning-text); }
.avatar-default { background: var(--color-background-main); color: var(--color-text-secondary); }

.client-name {
  font-size: var(--font-body-main-size);
  font-weight: 500;
  color: var(--color-text-primary);
}

.client-phone {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.cell-type,
.cell-diagnosis {
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  max-width: 180px;
}

.cell-diagnosis {
  color: var(--color-text-secondary);
}

.date-primary {
  font-size: var(--font-body-main-size);
  font-weight: 500;
  color: var(--color-text-primary);
}

.date-secondary {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  white-space: nowrap;
}

.status-completada { background: var(--color-status-success-bg); color: var(--color-status-success-text); }
.status-completada i { color: var(--color-status-success-indicator); }

.status-en_proceso { background: var(--color-status-info-bg); color: var(--color-status-info-text); }
.status-en_proceso i { color: var(--color-status-info-indicator); }

.status-pendiente {
  background: color-mix(in srgb, var(--color-status-warning-indicator) 14%, white);
  color: var(--color-status-warning-text);
}
.status-pendiente i { color: var(--color-status-warning-indicator); }

.status-cancelada { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); }
.status-cancelada i { color: var(--color-status-danger-indicator); }

.status-urgente { background: var(--color-status-warning-bg); color: var(--color-status-warning-text); }
.status-urgente i { color: var(--color-status-warning-indicator); }

.status-critico { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); }
.status-critico i { color: var(--color-status-danger-indicator); }

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.action-view .action-icon-wrap { color: var(--color-primary-main); background: var(--color-primary-subtle); border-color: color-mix(in srgb, var(--color-primary-main) 18%, transparent); }
.action-edit .action-icon-wrap { color: var(--color-text-secondary); }
.action-print .action-icon-wrap { color: var(--color-text-secondary); }
.action-close .action-icon-wrap { color: var(--color-status-warning-indicator); background: var(--color-status-warning-bg); border-color: color-mix(in srgb, var(--color-status-warning-indicator) 20%, transparent); }
.action-icon-wrap.closed { color: var(--color-status-success-indicator); background: var(--color-status-success-bg); border-color: color-mix(in srgb, var(--color-status-success-indicator) 20%, transparent); }

.action-btn:hover:not(:disabled) .action-icon-wrap {
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, var(--color-border-light));
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.closed-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.results-summary {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn,
.pagination-nav-btn {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: var(--font-body-main-size);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.pagination-btn:hover:not(.active),
.pagination-nav-btn:hover:not(.disabled-btn) {
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
}

.pagination-btn.active {
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border-color: var(--color-primary-main);
  font-weight: 600;
}

.disabled-btn {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-dots {
  color: var(--color-text-muted);
  font-size: var(--font-body-main-size);
  padding: 0 4px;
}

.pagination-nav-btn i {
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 32px;
  text-align: center;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
  color: var(--color-primary-main);
  font-size: 26px;
  margin-bottom: 4px;
}

.empty-title {
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.empty-description {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 360px;
}

.empty-action {
  margin-top: 8px;
}


.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: var(--font-body-main-size); font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}
.toast-success { background: var(--color-status-success-bg); color: var(--color-status-success-text); border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 30%, transparent); }
.toast-info { background: var(--color-status-info-bg); color: var(--color-status-info-text); border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 30%, transparent); }
.toast-error { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 30%, transparent); }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }


.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(15, 23, 42, 0.75);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-enter-active { animation: fadeIn 0.25s ease; }
.modal-leave-active { animation: fadeOut 0.2s ease; }
.modal-enter-active .modal-container { animation: scaleIn 0.25s ease; }
.modal-leave-active .modal-container { animation: scaleOut 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }


.modal-container {
  background: var(--color-background-surface);
  border-radius: var(--radius-large);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border-light);
}

.register-modal {
  max-width: 720px;
}

.view-modal {
  max-width: 640px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  background: var(--color-background-surface);
  z-index: 1;
  border-radius: var(--radius-large) var(--radius-large) 0 0;
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 22%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.modal-header-icon.icon-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.modal-header-icon.icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 22%, transparent);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.modal-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 16px;
  transition: background 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.register-form {
  display: flex;
  flex-direction: column;
}

.register-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px 8px;
}

.detail-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px;
}

.register-panel,
.detail-panel {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.detail-panel-info {
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 20%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-info-bg) 40%, var(--color-background-surface));
}

.detail-panel-primary {
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
}

.detail-panel-success {
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 20%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-success-bg) 35%, var(--color-background-surface));
}

.register-panel-title,
.detail-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.register-panel-icon,
.detail-panel-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: 13px;
  flex-shrink: 0;
}

.register-panel-icon-info,
.detail-panel-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
}

.register-panel-icon-success,
.detail-panel-icon-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
}

.register-panel-icon-warning {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.span-full {
  grid-column: 1 / -1;
}

.register-form .form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.register-form .form-group input,
.register-form .form-group select,
.register-form .form-group textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.register-form .form-group input:focus,
.register-form .form-group select:focus,
.register-form .form-group textarea:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.register-form .form-group input::placeholder,
.register-form .form-group textarea::placeholder {
  color: var(--color-text-muted);
}

.register-form .form-group textarea {
  resize: vertical;
  min-height: 72px;
}

.register-form .form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.has-error input,
.has-error select,
.has-error textarea {
  border-color: var(--color-status-danger-indicator);
}

.has-error input:focus,
.has-error select:focus,
.has-error textarea:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-status-danger-indicator) 14%, transparent);
}

.error-text {
  font-size: 12px;
  color: var(--color-status-danger-text);
  font-weight: 500;
}

.items-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.supply-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.supply-select,
.supply-qty {
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}

.supply-select {
  flex: 2;
  min-width: 0;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.supply-qty {
  flex: 1;
  min-width: 72px;
  max-width: 100px;
}

.supply-select:focus,
.supply-qty:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.supply-remove-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-standard);
  background: var(--color-status-danger-indicator);
  color: var(--color-primary-contrastText);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.supply-remove-btn:hover {
  background: color-mix(in srgb, var(--color-status-danger-indicator) 88%, #000);
}

.supply-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 9px 14px;
  border: none;
  border-radius: var(--radius-standard);
  background: var(--color-status-success-indicator);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-main-size);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.supply-add-btn:hover {
  background: color-mix(in srgb, var(--color-status-success-indicator) 88%, #000);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid var(--color-border-light);
  position: sticky;
  bottom: 0;
  background: var(--color-background-surface);
  border-radius: 0 0 var(--radius-large) var(--radius-large);
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: var(--radius-standard);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-cancel:hover {
  background: var(--color-background-main);
  border-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-border-light));
}

.btn-submit {
  padding: 10px 24px;
  border-radius: var(--radius-standard);
  border: none;
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-main-size);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-submit-success {
  background: var(--color-status-success-indicator);
}

.btn-submit-success:hover {
  background: color-mix(in srgb, var(--color-status-success-indicator) 88%, black);
}

.detail-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 90%, transparent);
  border-radius: var(--radius-standard);
}

.detail-field.span-full {
  grid-column: 1 / -1;
}

.detail-field-label {
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-field-value {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-field .status-badge {
  display: inline-flex;
  margin-top: 2px;
  width: fit-content;
}

.diagnosis-box {
  padding: 12px 14px;
  border-radius: var(--radius-standard);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-main);
  color: var(--color-text-primary);
  font-size: var(--font-body-main-size);
  line-height: 1.55;
  font-style: italic;
}

.notes-box {
  padding: 12px 14px;
  border-radius: var(--radius-standard);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 24%, transparent);
  border-left: 4px solid var(--color-status-warning-indicator);
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
  font-size: var(--font-body-main-size);
  line-height: 1.6;
  white-space: pre-wrap;
}

.vitals-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.vital-detail-chip {
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  border-radius: var(--radius-standard);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-detail-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-status-success-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.vital-detail-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}


@media (max-width: 1024px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .page-header .btn-primary { justify-content: center; }
  .filters-panel { flex-direction: column; align-items: stretch; }
  .search-input-wrapper { width: 100%; min-width: 0; }
  .filters-group { width: 100%; flex-direction: column; align-items: stretch; }
  .filter-select-wrap,
  .select-filter,
  .date-input-wrapper,
  .date-input,
  .reset-button { width: 100%; }
}

@media (max-width: 768px) {
  .consultas-table, .consultas-table tbody, .consultas-table tr, .consultas-table td {
    display: block;
    width: 100%;
  }
  .consultas-table thead {
    display: none;
  }
  .consultas-table tr {
    margin-bottom: 16px;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-standard);
    padding: 16px;
    background: var(--color-background-surface);
    box-shadow: var(--shadow-card);
  }
  .consultas-table td {
    padding: 10px 0;
    text-align: right;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .consultas-table td:last-child {
    border-bottom: none;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
  }
  .consultas-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 13px;
    text-align: left;
    margin-right: 16px;
  }
  .patient-cell, .client-cell, .date-cell {
    align-items: flex-end;
    text-align: right;
  }
  .patient-cell { flex-direction: row; justify-content: flex-end; }
}

@media (max-width: 640px) {
  .modal-overlay { padding: 12px; }
  .modal-container { max-height: 95vh; }
  .modal-header { padding: 16px 20px; }
  .register-form-content,
  .detail-form-content,
  .modal-body { padding: 16px 20px; }
  .register-form-content { padding-bottom: 8px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid,
  .detail-fields-grid { grid-template-columns: 1fr; }
  .form-group.span-full,
  .detail-field.span-full { grid-column: 1; }
  .vitals-detail-grid { grid-template-columns: repeat(2, 1fr); }
  .supply-row { flex-wrap: wrap; }
  .supply-select { flex: 1 1 100%; max-width: none; }
  .supply-qty { flex: 1; max-width: none; }
}

.payment-modal {
  max-width: 450px;
}

.payment-summary {
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  padding: 16px;
  border-radius: var(--radius-standard);
  border: 1px solid var(--color-border-light);
  margin-bottom: 20px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
}

.payment-row--item {
  font-size: var(--font-body-caption-size);
}

.payment-row--total {
  font-size: 18px;
  color: var(--color-text-primary);
  margin-bottom: 0;
}

.payment-amount {
  font-weight: 600;
  color: var(--color-text-primary);
}

.payment-total {
  color: var(--color-status-success-indicator);
}

.payment-divider {
  border-top: 1px dashed var(--color-border-light);
  margin: 10px 0;
}

.payment-methods {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.payment-method-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-standard);
  border: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-main) 40%, var(--color-background-surface));
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 600;
  font-size: var(--font-body-main-size);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.payment-method-btn.active {
  background: var(--color-primary-main);
  border-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
}

.payment-actions {
  margin-top: 24px;
}

.modal-body {
  padding: 24px 28px;
}
</style>
