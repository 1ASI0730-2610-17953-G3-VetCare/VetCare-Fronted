<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

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
  vitalCondition: ''
});
const form = reactive(getDefaultForm());

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateFilter.value = '';
};

const consultas = ref([
  {
    id: '#C-1245',
    patient: { name: 'Max', breed: 'Golden Retriever', type: 'dog' },
    client: { name: 'María González', phone: '555-0123' },
    type: 'Consulta General',
    diagnosis: 'Dermatitis alérgica',
    date: 'Hoy',
    time: '10:30 AM',
    status: 'completada'
  },
  {
    id: '#C-1244',
    patient: { name: 'Luna', breed: 'Gato Persa', type: 'cat' },
    client: { name: 'Carlos Ruiz', phone: '555-0456' },
    type: 'Vacunación',
    diagnosis: 'Vacuna antirrábica anual',
    date: 'Hoy',
    time: '11:45 AM',
    status: 'en_proceso'
  },
  {
    id: '#C-1243',
    patient: { name: 'Rocky', breed: 'Bulldog', type: 'dog' },
    client: { name: 'Ana Martínez', phone: '555-0789' },
    type: 'Emergencia',
    diagnosis: 'Gastroenteritis aguda',
    date: 'Ayer',
    time: '4:20 PM',
    status: 'critico'
  },
  {
    id: '#C-1242',
    patient: { name: 'Bella', breed: 'Labrador', type: 'dog' },
    client: { name: 'Luis Sánchez', phone: '555-0234' },
    type: 'Chequeo Preventivo',
    diagnosis: 'Control de rutina - Estado saludable',
    date: '15 Ene',
    time: '9:00 AM',
    status: 'pendiente'
  },
  {
    id: '#C-1241',
    patient: { name: 'Simba', breed: 'Gato Siamés', type: 'cat' },
    client: { name: 'Elena Gómez', phone: '555-0567' },
    type: 'Post-Operatorio',
    diagnosis: 'Control post esterilización',
    date: '14 Ene',
    time: '3:30 PM',
    status: 'completada'
  }
]);

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
    editingId.value = consulta.id;
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

const closeConsulta = (consulta) => {
  const idx = consultas.value.findIndex(c => c.id === consulta.id);
  if (idx !== -1) {
    consultas.value[idx] = { ...consultas.value[idx], status: 'completada' };
    displayToast(t('clinicManagement.consultations.closeSuccess'), 'success');
  }
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
  if (!form.patientName.trim()) formErrors.patientName = true;
  if (!form.clientName.trim()) formErrors.clientName = true;
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
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (editingId.value) {
      const idx = consultas.value.findIndex(c => c.id === editingId.value);
      if (idx !== -1) {
        consultas.value[idx] = {
           ...consultas.value[idx],
           patient: { ...consultas.value[idx].patient, name: form.patientName },
           client: { ...consultas.value[idx].client, name: form.clientName },
           type: form.type,
           status: form.status,
           diagnosis: form.diagnosis,
           notes: form.notes.trim() || null,
           vitals: (form.vitalTemp || form.vitalHR || form.vitalWeight || form.vitalCondition)
             ? { temp: form.vitalTemp, hr: form.vitalHR, weight: form.vitalWeight, condition: form.vitalCondition }
             : null,
           date: form.date ? formatDate(form.date) : consultas.value[idx].date,
           time: form.time ? formatTime(form.time) : consultas.value[idx].time
        };
      }
      displayToast('Consulta actualizada exitosamente', 'success');
    } else {
      const newId = `#C-${String(consultas.value.length + 1246)}`;
      const newConsulta = {
        id: newId,
        patient: { name: form.patientName, breed: 'Mascota', type: 'dog' },
        client: { name: form.clientName, phone: '--' },
        type: form.type,
        diagnosis: form.diagnosis || 'Pendiente de evaluación',
        notes: form.notes.trim() || null,
        vitals: (form.vitalTemp || form.vitalHR || form.vitalWeight || form.vitalCondition)
          ? { temp: form.vitalTemp, hr: form.vitalHR, weight: form.vitalWeight, condition: form.vitalCondition }
          : null,
        date: formatDate(form.date),
        time: form.time ? formatTime(form.time) : '--:--',
        status: form.status
      };
      consultas.value.unshift(newConsulta);
      displayToast(t('clinicManagement.consultations.registerForm.successMessage'), 'success');
    }
    
    closeModal();
  } catch (e) {
    displayToast(t('clinicManagement.consultations.registerForm.errorMessage'), 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  if (route.query.new === 'true') {
    openModal();

    router.replace({ query: {} });
  }
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

    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.consultations.title') }}</h1>
        <p class="view-description">{{ t('clinicManagement.consultations.description') }}</p>
      </div>
      <button class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.consultations.register') }}
      </button>
    </div>

    <div class="consultas-card">
      <div class="card-header">
        <h2 class="section-title">{{ t('clinicManagement.consultations.recentTitle') }}</h2>
      </div>
      <div class="filters-bar">
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
          <select v-model="statusFilter" class="select-filter">
            <option value="">{{ t('clinicManagement.consultations.allStatuses') }}</option>
            <option value="completada">{{ t('clinicManagement.consultations.status.completada') }}</option>
            <option value="en_proceso">{{ t('clinicManagement.consultations.status.en_proceso') }}</option>
            <option value="pendiente">{{ t('clinicManagement.consultations.status.pendiente') }}</option>
            <option value="critico">{{ t('clinicManagement.consultations.status.critico') }}</option>
          </select>
          
          <div class="date-input-wrapper">
            <i class="pi pi-calendar date-icon"></i>
            <input 
              type="date" 
              v-model="dateFilter" 
              class="date-input"
            />
          </div>
          
          <button @click="resetFilters" class="reset-button">
            <i class="pi pi-times"></i>
            {{ t('clinicManagement.consultations.clearFilters') }}
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="consultas-table">
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
                  <div class="pet-avatar" :class="getAvatarClass(consulta.patient.breed)">
                    {{ consulta.patient.name.charAt(0) }}
                  </div>
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
                <button class="action-btn view-btn" :title="t('clinicManagement.consultations.actions.viewDetail')" @click="openViewModal(consulta)">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="action-btn edit-btn" :title="t('clinicManagement.consultations.actions.edit')" @click="openModal(consulta)" :disabled="consulta.status === 'completada'">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn print-btn" :title="t('clinicManagement.consultations.actions.print')" @click="printConsulta(consulta)" :disabled="isPrinting && printId === consulta.id">
                  <i :class="isPrinting && printId === consulta.id ? 'pi pi-spin pi-spinner' : 'pi pi-print'"></i>
                </button>
                <button
                  v-if="consulta.status !== 'completada'"
                  class="action-btn close-btn"
                  :title="t('clinicManagement.consultations.actions.close')"
                  @click="closeConsulta(consulta)"
                >
                  <i class="pi pi-lock-open"></i>
                </button>
                <span v-else class="closed-indicator" :title="t('clinicManagement.consultations.actions.closedTooltip')">
                  <i class="pi pi-lock"></i>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar" v-if="filteredConsultas.length > 0">
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
      
      <div v-else class="empty-state-container" style="padding: 40px; text-align: center; color: #6b7280;">
        <i class="pi pi-inbox" style="font-size: 32px; margin-bottom: 12px; color: #9ca3af;"></i>
        <p>No se encontraron consultas que coincidan con los filtros.</p>
      </div>
    </div>

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-briefcase"></i></div>
            <div>
              <h2 class="modal-title">{{ editingId ? `Editar Consulta ${editingId}` : t('clinicManagement.consultations.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.consultations.registerForm.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-users"></i> {{ t('clinicManagement.consultations.registerForm.patientInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.patientName }">
                  <label>{{ t('clinicManagement.consultations.registerForm.patientName') }} *</label>
                  <input type="text" v-model="form.patientName" :placeholder="t('clinicManagement.consultations.registerForm.patientNamePlaceholder')" />
                  <span v-if="formErrors.patientName" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.clientName }">
                  <label>{{ t('clinicManagement.consultations.registerForm.clientName') }} *</label>
                  <input type="text" v-model="form.clientName" :placeholder="t('clinicManagement.consultations.registerForm.clientNamePlaceholder')" />
                  <span v-if="formErrors.clientName" class="error-text">{{ t('clinicManagement.consultations.registerForm.required') }}</span>
                </div>
              </div>
            </div>

            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-folder-open"></i> {{ t('clinicManagement.consultations.registerForm.consultationInfo') }}</h3>
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
            </div>


            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-heart-fill"></i> {{ t('clinicManagement.consultations.registerForm.vitalsTitle') }}</h3>
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
            </div>


            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('clinicManagement.consultations.registerForm.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? t('clinicManagement.consultations.registerForm.saving') : (editingId ? 'Guardar Cambios' : t('clinicManagement.consultations.registerForm.save')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    
    <Transition name="modal">
      <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon" style="background: linear-gradient(135deg, #10B981, #059669);"><i class="pi pi-file"></i></div>
            <div>
              <h2 class="modal-title">Detalle de Consulta {{ viewedConsulta?.id }}</h2>
              <p class="modal-subtitle">Resumen clínico y datos de la atención</p>
            </div>
            <button class="modal-close" @click="closeViewModal"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body" v-if="viewedConsulta">
            <div class="detail-section">
               <h3 class="detail-title"><i class="pi pi-user"></i> Datos del Paciente</h3>
               <div class="detail-grid">
                  <div class="detail-item"><span>Paciente:</span> <strong>{{ viewedConsulta.patient.name }}</strong> ({{ viewedConsulta.patient.breed }})</div>
                  <div class="detail-item"><span>Cliente:</span> <strong>{{ viewedConsulta.client.name }}</strong></div>
                  <div class="detail-item"><span>Teléfono:</span> <strong>{{ viewedConsulta.client.phone }}</strong></div>
               </div>
            </div>
            <div class="detail-section">
               <h3 class="detail-title"><i class="pi pi-folder-open"></i> Información Médica</h3>
               <div class="detail-grid">
                  <div class="detail-item"><span>Tipo:</span> <strong>{{ viewedConsulta.type }}</strong></div>
                  <div class="detail-item"><span>Fecha:</span> <strong>{{ viewedConsulta.date }} {{ viewedConsulta.time }}</strong></div>
                  <div class="detail-item span-full">
                     <span>Estado:</span> 
                     <div class="status-badge" :class="getStatusBadgeClass(viewedConsulta.status)" style="display:inline-flex; margin-top:4px;">
                        <i :class="getStatusIcon(viewedConsulta.status)"></i> {{ getStatusLabel(viewedConsulta.status) }}
                     </div>
                  </div>
                  <div class="detail-item span-full">
                     <span>Diagnóstico / Motivo:</span>
                     <div class="diagnosis-box">{{ viewedConsulta.diagnosis }}</div>
                  </div>
                  <div v-if="viewedConsulta.notes" class="detail-item span-full">
                     <span>{{ t('clinicManagement.consultations.registerForm.notes') }}:</span>
                     <div class="notes-box">{{ viewedConsulta.notes }}</div>
                  </div>
               </div>
            </div>
            <div v-if="viewedConsulta.vitals" class="detail-section">
               <h3 class="detail-title"><i class="pi pi-heart-fill"></i> {{ t('clinicManagement.consultations.registerForm.vitalsTitle') }}</h3>
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
  gap: 24px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.view-title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0 0 4px 0;
}

.view-description {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
  margin: 0;
}

.btn-primary {
  background-color: #0EA5E9;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #0284C7;
}

.consultas-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px 0 24px;
}

.section-title {
  font-size: 18px;
  line-height: 28px;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px 8px 36px;
  color: #111827;
  font-size: 14px;
  width: 280px;
  outline: none;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2,132,199,0.15);
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.select-filter {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  color: #374151;
  font-size: 14px;
  min-width: 160px;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.select-filter:focus {
  border-color: #0284c7;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
}

.date-input {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px 8px 36px;
  color: #111827;
  font-size: 14px;
  width: 160px;
  outline: none;
  transition: all 0.2s;
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
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2,132,199,0.15);
}

.reset-button {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.reset-button i {
  color: #9ca3af;
  font-size: 12px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.consultas-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.consultas-table th {
  background-color: #f1f5f9;
  padding: 12px 24px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.actions-header {
  text-align: center;
}

.consultas-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.consultas-table tbody tr:hover {
  background-color: #f9fafb;
}

.consultas-table td {
  padding: 16px 24px;
  vertical-align: middle;
}

.cell-id {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #111827;
}

.patient-cell, .client-cell, .date-cell {
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
}

.patient-name {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: #111827;
}

.patient-breed {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
}

.pet-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.avatar-golden { background-color: #fef3c7; color: #d97706; }
.avatar-persa { background-color: #ede9fe; color: #7c3aed; }
.avatar-bulldog { background-color: #fce7f3; color: #db2777; }
.avatar-labrador { background-color: #ccfbf1; color: #0d9488; }
.avatar-siames { background-color: #ffedd5; color: #ea580c; }
.avatar-default { background-color: #f3f4f6; color: #6b7280; }

.client-name {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #111827;
  letter-spacing: -0.5px;
}

.client-phone {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
}

.cell-type, .cell-diagnosis {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #111827;
  letter-spacing: -0.5px;
}

.date-primary {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #111827;
  letter-spacing: -0.5px;
}

.date-secondary {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: -0.5px;
}

.status-completada { background-color: #dcfce7; color: #166534; }
.status-completada i { color: #16a34a; }

.status-en_proceso { background-color: #dbeafe; color: #1e40af; }
.status-en_proceso i { color: #2563eb; }

.status-pendiente { background-color: #fef9c3; color: #854d0e; }
.status-pendiente i { color: #ca8a04; }

.status-cancelada { background-color: #fee2e2; color: #991b1b; }
.status-cancelada i { color: #dc2626; }

.status-urgente { background-color: #fff7ed; color: #9a3412; }
.status-urgente i { color: #ea580c; }

.status-critico { background-color: #fee2e2; color: #991b1b; }
.status-critico i { color: #ef4444; }

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.view-btn i { color: #0ea5e9; font-size: 18px; }
.edit-btn i { color: #6b7280; font-size: 18px; }
.print-btn i { color: #6b7280; font-size: 18px; }
.close-btn i { color: #f97316; font-size: 18px; }
.closed-indicator { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
.closed-indicator i { color: #10b981; font-size: 16px; }
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.results-summary {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn, .pagination-nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.active), .pagination-nav-btn:hover {
  background-color: #f3f4f6;
}

.pagination-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  font-weight: 600;
}

.disabled-btn {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.pagination-dots {
  color: #6b7280;
  font-size: 14px;
  padding: 0 4px;
}

.pagination-nav-btn i {
  font-size: 12px;
}


.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}
.toast-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
.toast-info { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
.toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
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
  background: #FFFFFF; border-radius: 16px;
  width: 100%; max-width: 680px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}


.modal-header {
  display: flex; align-items: center; gap: 16px;
  padding: 24px 28px; border-bottom: 1px solid #E2E8F0;
  position: sticky; top: 0; background: #FFFFFF; z-index: 1;
  border-radius: 16px 16px 0 0;
}
.modal-header-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px; flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0; }
.modal-subtitle { font-size: 13px; color: #64748B; margin: 4px 0 0 0; }
.modal-close {
  margin-left: auto; background: none; border: none; cursor: pointer;
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #64748B; font-size: 16px; transition: all 0.2s;
}
.modal-close:hover { background: #F1F5F9; color: #0F172A; }


.modal-body { padding: 24px 28px; }


.form-section {
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid #F1F5F9;
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-label {
  font-size: 14px; font-weight: 600; color: #334155;
  margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
}
.section-label i { color: #0EA5E9; font-size: 15px; }


.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.span-full { grid-column: 1 / -1; }
.form-group label {
  font-size: 13px; font-weight: 500; color: #475569;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 14px; color: #1E293B; background: #FFFFFF;
  outline: none; transition: all 0.2s; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: #94A3B8; }
.form-group textarea { resize: vertical; min-height: 72px; }
.form-group select { cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px;
}


.has-error input, .has-error select, .has-error textarea { border-color: #EF4444; }
.has-error input:focus, .has-error select:focus, .has-error textarea:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
.error-text { font-size: 12px; color: #EF4444; font-weight: 500; }


.modal-actions {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 20px 28px; border-top: 1px solid #E2E8F0;
  position: sticky; bottom: 0; background: #FFFFFF;
  border-radius: 0 0 16px 16px;
}
.btn-cancel {
  padding: 10px 20px; border-radius: 8px; border: 1px solid #E2E8F0;
  background: #FFFFFF; color: #475569; font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover { background: #F8FAFC; border-color: #CBD5E1; }
.btn-submit {
  padding: 10px 24px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
  color: #FFFFFF; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.btn-submit:hover { background: linear-gradient(135deg, #0284C7, #0369A1); box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }


@media (max-width: 1024px) {
  .actions-bar { flex-direction: column; align-items: stretch; gap: 16px; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .search-input-wrapper, .search-input { width: 100%; }
  .filters-group { width: 100%; flex-direction: column; }
  .select-filter, .date-input-wrapper, .date-input, .reset-button { width: 100%; }
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
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .consultas-table td {
    padding: 10px 0;
    text-align: right;
    border-bottom: 1px solid #f1f5f9;
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
    color: #64748B;
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
  .modal-body { padding: 16px 20px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .form-group.span-full { grid-column: 1; }
  .detail-item.span-full { grid-column: 1; }
}


.detail-section {
  margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9;
}
.detail-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.detail-title {
  font-size: 15px; font-weight: 600; color: #1E293B; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
}
.detail-title i { color: #10B981; font-size: 16px; }
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.detail-item {
  display: flex; flex-direction: column; gap: 4px; font-size: 14px;
}
.detail-item.span-full { grid-column: 1 / -1; }
.detail-item span { color: #64748B; font-size: 13px; font-weight: 500; }
.detail-item strong { color: #0F172A; font-weight: 600; }
.diagnosis-box {
  background: #F8FAFC; padding: 12px 16px; border-radius: 8px; border: 1px solid #E2E8F0;
  color: #334155; font-size: 14px; line-height: 1.5; margin-top: 4px; font-style: italic;
}
.notes-box {
  background: #FFFBEB; padding: 12px 16px; border-radius: 8px;
  border: 1px solid #FDE68A; border-left: 4px solid #F59E0B;
  color: #78350F; font-size: 14px; line-height: 1.6; margin-top: 4px; white-space: pre-wrap;
}
.vitals-detail-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.vital-detail-chip {
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;
}
.vital-detail-label { font-size: 11px; font-weight: 500; color: #16a34a; text-transform: uppercase; }
.vital-detail-value { font-size: 20px; font-weight: 700; color: #111827; }
@media (max-width: 640px) { .vitals-detail-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
