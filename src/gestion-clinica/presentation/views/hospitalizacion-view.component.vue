<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();


const filterTabs = ref([
  { id: 'todos', label: 'Todos', active: true },
  { id: 'Crítico', label: 'Crítico', active: false },
  { id: 'Estable', label: 'Estable', active: false },
  { id: 'Recuperación', label: 'Recuperación', active: false }
]);

const selectTab = (id) => {
  filterTabs.value.forEach(tab => tab.active = tab.id === id);
};

const patients = ref([
  {
    id: 1,
    patient: {
      name: 'Max',
      species: 'Perro',
      breed: 'Golden Retriever',
      age: '5 años',
      palette: 'dog_golden'
    },
    owner: { name: 'Ana García', phone: '+34 612 345 678' },
    status: 'Crítico',
    admissionDate: { formatted: '09 May 2026', relative: 'Hace 3 días' },
    diagnosis: 'Parvovirosis',
    treatments: ['Fluidoterapia IV', 'Antibióticos', 'Antivirales']
  },
  {
    id: 2,
    patient: {
      name: 'Luna',
      species: 'Gato',
      breed: 'Persa',
      age: '3 años',
      palette: 'cat_purple'
    },
    owner: { name: 'Pedro Martínez', phone: '+34 623 456 789' },
    status: 'Estable',
    admissionDate: { formatted: '10 May 2026', relative: 'Hace 2 días' },
    diagnosis: 'Post-cirugía',
    treatments: ['Analgésicos', 'Antibióticos']
  },
  {
    id: 3,
    patient: {
      name: 'Rocky',
      species: 'Perro',
      breed: 'Bulldog',
      age: '4 años',
      palette: 'dog_blue'
    },
    owner: { name: 'Laura Sánchez', phone: '+34 634 567 890' },
    status: 'Crítico',
    admissionDate: { formatted: '11 May 2026', relative: 'Hace 1 día' },
    diagnosis: 'Insuficiencia renal',
    treatments: ['Diálisis', 'Soporte nutricional']
  },
  {
    id: 4,
    patient: {
      name: 'Mimi',
      species: 'Gato',
      breed: 'Siamés',
      age: '2 años',
      palette: 'cat_pink'
    },
    owner: { name: 'Carlos Ruiz', phone: '+34 645 678 901' },
    status: 'Estable',
    admissionDate: { formatted: '08 May 2026', relative: 'Hace 4 días' },
    diagnosis: 'Fractura femoral',
    treatments: ['Inmovilización', 'Analgésicos']
  },
  {
    id: 5,
    patient: {
      name: 'Toby',
      species: 'Perro',
      breed: 'Beagle',
      age: '6 años',
      palette: 'dog_green'
    },
    owner: { name: 'María López', phone: '+34 656 789 012' },
    status: 'Estable',
    admissionDate: { formatted: '10 May 2026', relative: 'Hace 2 días' },
    diagnosis: 'Gastroenteritis',
    treatments: ['Hidratación IV', 'Dieta blanda']
  }
]);

const getStatusClass = (status) => {
  if (status === 'Crítico') return 'status-critical';
  if (status === 'Estable') return 'status-stable';
  if (status === 'Recuperación') return 'status-recovery';
  return '';
};

const getAvatarImage = (patient) => {
  if (patient.name === 'Max') return 'https://placedog.net/150/150?id=30';
  if (patient.name === 'Luna') return 'https://placecats.com/neo/150/150';
  if (patient.name === 'Rocky') return 'https://placedog.net/150/150?id=32';
  if (patient.name === 'Mimi') return 'https://placecats.com/millie/150/150';
  if (patient.name === 'Toby') return 'https://placedog.net/150/150?id=35';
  return null;
};

const filteredPatients = computed(() => {
  const activeTab = filterTabs.value.find(tab => tab.active);
  if (!activeTab || activeTab.id === 'todos') {
    return patients.value;
  }
  return patients.value.filter(patient => patient.status === activeTab.id);
});

const getTabCount = (tabId) => {
  if (tabId === 'todos') return patients.value.length;
  return patients.value.filter(p => p.status === tabId).length;
};


const showViewModal = ref(false);
const showEditModal = ref(false);
const selectedPatient = ref(null);

const openViewModal = (patient) => {
  selectedPatient.value = patient;
  showViewModal.value = true;
};

const openEditModal = (patient) => {
  selectedPatient.value = { ...patient };
  showEditModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  showEditModal.value = false;
  showRegisterModal.value = false;
  selectedPatient.value = null;
};


const showRegisterModal = ref(false);
const newPatientForm = ref({
  patientName: '',
  species: 'Perro',
  breed: '',
  age: '',
  ownerName: '',
  ownerPhone: '',
  diagnosis: '',
  status: 'Estable'
});

const openRegisterModal = () => {
  newPatientForm.value = {
    patientName: '',
    species: 'Perro',
    breed: '',
    age: '',
    ownerName: '',
    ownerPhone: '',
    diagnosis: '',
    status: 'Estable'
  };
  showRegisterModal.value = true;
};

const registerPatient = () => {
  const newId = patients.value.length + 1;
  const palette = newPatientForm.value.species === 'Perro' ? 'dog_blue' : 'cat_purple';
  
  patients.value.unshift({
    id: newId,
    patient: {
      name: newPatientForm.value.patientName,
      species: newPatientForm.value.species,
      breed: newPatientForm.value.breed,
      age: newPatientForm.value.age,
      palette: palette
    },
    owner: { 
      name: newPatientForm.value.ownerName, 
      phone: newPatientForm.value.ownerPhone 
    },
    status: newPatientForm.value.status,
    admissionDate: { 
      formatted: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }), 
      relative: 'Hoy' 
    },
    diagnosis: newPatientForm.value.diagnosis,
    treatments: ['Pendiente de evaluación']
  });
  
  closeModals();
};


const dailyTracking = ref([
  {
    id: 1,
    icon_variant: "temperature",
    title: "Max - Control de temperatura",
    subtitle: "Temperatura: 39.2°C (Fiebre)",
    author: "Dr. Carlos Méndez",
    time: "08:00 AM"
  },
  {
    id: 2,
    icon_variant: "medication",
    title: "Luna - Medicación administrada",
    subtitle: "Antibiótico + Analgésico oral",
    author: "Dra. Isabel Torres",
    time: "09:30 AM"
  },
  {
    id: 3,
    icon_variant: "food",
    title: "Rocky - Alimentación",
    subtitle: "Dieta renal especial - 150g",
    author: "Auxiliar: Carmen Ruiz",
    time: "12:00 PM"
  },
  {
    id: 4,
    icon_variant: "vitals",
    title: "Mimi - Signos vitales",
    subtitle: "FC: 140 lpm | FR: 25 rpm | Estable",
    author: "Dr. Carlos Méndez",
    time: "14:00 PM"
  }
]);

const pendingTasks = ref([
  {
    id: "task_1",
    status: "urgent",
    title: "Max - Fluidoterapia",
    description: "Administrar 500ml solución Ringer",
    badge: "Urgente",
    time: "15:00 PM"
  },
  {
    id: "task_2",
    status: "today",
    title: "Rocky - Control analítica",
    description: "Tomar muestra para función renal",
    badge: "Hoy",
    time: "16:00 PM"
  },
  {
    id: "task_3",
    status: "scheduled",
    title: "Luna - Revisión post-operatoria",
    description: "Verificar estado de sutura",
    badge: "Programada",
    time: "18:00 PM"
  },
  {
    id: "task_4",
    status: "tomorrow",
    title: "Toby - Cambio de vendaje",
    description: "Renovar vendaje abdominal",
    badge: "Mañana",
    time: "10:00 AM"
  }
]);

const getIconClass = (variant) => {
  const map = {
    temperature: 'pi pi-thermometer',
    medication: 'pi pi-shield',
    food: 'pi pi-apple',
    vitals: 'pi pi-heart-fill'
  };
  return map[variant] || 'pi pi-circle';
};

const getVariantClass = (variant) => {
  return `variant-${variant}`;
};
</script>

<template>
  <div class="hospitalizacion-view">
    
    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.hospitalization.title') }}</h1>
        <p class="view-description">{{ t('clinicManagement.hospitalization.description') }}</p>
      </div>
      <button class="btn-primary" @click="openRegisterModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.hospitalization.register') }}
      </button>
    </div>

    
    <div class="stats-cards-row">
      
      <div class="stats-card">
        <div class="card-row-top">
          <span class="card-label">{{ t('clinicManagement.hospitalization.stats.total') }}</span>
          <div class="icon-badge badge-blue">
            <i class="pi pi-building icon-blue"></i>
          </div>
        </div>
        <div class="card-value-block">
          <span class="card-value">{{ patients.length }}</span>
          <span class="card-description desc-default">{{ t('clinicManagement.hospitalization.stats.activePatients') }}</span>
        </div>
      </div>

      
      <div class="stats-card">
        <div class="card-row-top">
          <span class="card-label">{{ t('clinicManagement.hospitalization.stats.critical') }}</span>
          <div class="icon-badge badge-red">
            <i class="pi pi-heart-fill icon-red"></i>
          </div>
        </div>
        <div class="card-value-block">
          <span class="card-value">{{ getTabCount('Crítico') }}</span>
          <span class="card-description desc-alert">{{ t('clinicManagement.hospitalization.stats.immediateAttention') }}</span>
        </div>
      </div>

      
      <div class="stats-card">
        <div class="card-row-top">
          <span class="card-label">{{ t('clinicManagement.hospitalization.stats.surgeriesToday') }}</span>
          <div class="icon-badge badge-amber">
            <i class="pi pi-user icon-amber"></i>
          </div>
        </div>
        <div class="card-value-block">
          <span class="card-value">3</span>
          <span class="card-description desc-default">{{ t('clinicManagement.hospitalization.stats.scheduledToday') }}</span>
        </div>
      </div>
    </div>

    
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title">{{ t('clinicManagement.hospitalization.table.title') }}</h2>
        <div class="filter-tabs">
          <button 
            v-for="tab in filterTabs" 
            :key="tab.id"
            :class="['filter-tab', { active: tab.active }]"
            @click="selectTab(tab.id)"
          >
            {{ tab.id === 'todos' ? t('clinicManagement.hospitalization.tabs.all') : t(`clinicManagement.hospitalization.status.${tab.id}`) }} ({{ getTabCount(tab.id) }})
          </button>
        </div>
      </div>
      <table class="patient-table">
        <thead>
          <tr>
            <th style="width: 25%;">{{ t('clinicManagement.hospitalization.table.columns.patient') }}</th>
            <th style="width: 17%;">{{ t('clinicManagement.hospitalization.table.columns.owner') }}</th>
            <th style="width: 10%;">{{ t('clinicManagement.hospitalization.table.columns.status') }}</th>
            <th style="width: 13%;">{{ t('clinicManagement.hospitalization.table.columns.admissionDate') }}</th>
            <th style="width: 15%;">{{ t('clinicManagement.hospitalization.table.columns.diagnosis') }}</th>
            <th style="width: 14%;">{{ t('clinicManagement.hospitalization.table.columns.treatment') }}</th>
            <th style="width: 6%; text-align: center;">{{ t('clinicManagement.hospitalization.table.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredPatients" :key="item.id">
            <td>
              <div class="patient-cell">
                <div :class="['patient-avatar', item.patient.palette]">
                  <img v-if="getAvatarImage(item.patient)" :src="getAvatarImage(item.patient)" :alt="item.patient.name" class="patient-image" />
                  <span v-else class="patient-initial">{{ item.patient.name.charAt(0) }}</span>
                </div>
                <div class="patient-text">
                  <span class="patient-name">{{ item.patient.name }}</span>
                  <span class="patient-subtitle">{{ item.patient.breed }} · {{ item.patient.age }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="owner-cell">
                <span class="owner-name">{{ item.owner.name }}</span>
                <span class="owner-phone">{{ item.owner.phone }}</span>
              </div>
            </td>
            <td>
              <div :class="['status-badge', getStatusClass(item.status)]">
                <span class="status-dot"></span>
                {{ t(`clinicManagement.hospitalization.status.${item.status}`) }}
              </div>
            </td>
            <td>
              <div class="date-cell">
                <span class="date-primary">{{ item.admissionDate.formatted }}</span>
                <span class="date-secondary">{{ item.admissionDate.relative }}</span>
              </div>
            </td>
            <td>
              <span class="diagnosis-text">{{ item.diagnosis }}</span>
            </td>
            <td>
              <div class="treatment-list">
                <span v-for="(treatment, index) in item.treatments" :key="index" class="treatment-item">
                  • {{ treatment }}
                </span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <i class="pi pi-eye action-view" :title="t('clinicManagement.hospitalization.actions.view')" @click="openViewModal(item)"></i>
                <i class="pi pi-pencil action-edit" :title="t('clinicManagement.hospitalization.actions.edit')" @click="openEditModal(item)"></i>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      
      <div class="pagination-bar" v-if="filteredPatients.length > 0">
        <div class="results-summary">
          {{ t('clinicManagement.hospitalization.pagination.showing', { from: 1, to: filteredPatients.length, total: filteredPatients.length }) }}
        </div>
        <div class="pagination-controls">
          <button class="pagination-nav-btn disabled-btn" disabled>
            <i class="pi pi-chevron-left"></i>
          </button>
          <button class="pagination-btn active">1</button>
          <button class="pagination-nav-btn disabled-btn" disabled>
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    
    <div class="tracking-tasks-row">
      
      <div class="tracking-card">
        <div class="card-header">
          <i class="pi pi-calendar-plus header-icon"></i>
          <h2 class="header-title">{{ t('clinicManagement.hospitalization.dailyTracking.title') }}</h2>
        </div>
        
        <div class="tracking-list">
          <div v-for="item in dailyTracking" :key="item.id" class="tracking-item">
            <div class="item-left">
              <div :class="['icon-circle', getVariantClass(item.icon_variant)]">
                <img v-if="getAvatarImage({ name: item.title.split(' - ')[0] })" :src="getAvatarImage({ name: item.title.split(' - ')[0] })" :alt="item.title.split(' - ')[0]" class="patient-image" />
                <i v-else :class="getIconClass(item.icon_variant)"></i>
              </div>
              <div class="text-group">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-subtitle">{{ item.subtitle }}</span>
                <span class="item-author">{{ item.author }}</span>
              </div>
            </div>
            <div class="item-right">
              <span class="item-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>

      
      <div class="tasks-widget">
        <div class="tasks-header">
          <i class="pi pi-clipboard tasks-header-icon"></i>
          <h2 class="tasks-header-title">{{ t('clinicManagement.hospitalization.pendingTasks.title') }}</h2>
        </div>
        
        <div class="tasks-list">
          <div v-for="task in pendingTasks" :key="task.id" :class="['task-card', `task-${task.status}`]">
            <div class="task-accent-bar"></div>
            <div class="task-card-inner">
              <div class="task-checkbox"></div>
              <div class="task-content">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-subtitle">{{ task.description }}</span>
                <div class="task-footer">
                  <span :class="['task-badge', `badge-${task.status}`]">{{ t(`clinicManagement.hospitalization.pendingTasks.status.${task.status}`) }}</span>
                  <span class="task-time">{{ task.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    
    
    <div v-if="showViewModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t('clinicManagement.hospitalization.modals.view.title') }}</h2>
          <i class="pi pi-times close-icon" @click="closeModals"></i>
        </div>
        <div class="modal-body" v-if="selectedPatient">
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.patient') }}:</label>
            <p>{{ selectedPatient.patient.name }} ({{ selectedPatient.patient.breed }}, {{ selectedPatient.patient.age }})</p>
          </div>
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.owner') }}:</label>
            <p>{{ selectedPatient.owner.name }} - {{ selectedPatient.owner.phone }}</p>
          </div>
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.status') }}:</label>
            <p>{{ t(`clinicManagement.hospitalization.status.${selectedPatient.status}`) }}</p>
          </div>
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.admissionDate') }}:</label>
            <p>{{ selectedPatient.admissionDate.formatted }} ({{ selectedPatient.admissionDate.relative }})</p>
          </div>
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.diagnosis') }}:</label>
            <p>{{ selectedPatient.diagnosis }}</p>
          </div>
          <div class="detail-group">
            <label>{{ t('clinicManagement.hospitalization.modals.view.treatments') }}:</label>
            <ul>
              <li v-for="(treatment, index) in selectedPatient.treatments" :key="index">{{ treatment }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    
    <div v-if="showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t('clinicManagement.hospitalization.modals.edit.title') }}</h2>
          <i class="pi pi-times close-icon" @click="closeModals"></i>
        </div>
        <div class="modal-body" v-if="selectedPatient">
          <div class="form-group">
            <label>{{ t('clinicManagement.hospitalization.modals.edit.patientName') }}</label>
            <input type="text" v-model="selectedPatient.patient.name" class="form-input">
          </div>
          <div class="form-group">
            <label>{{ t('clinicManagement.hospitalization.modals.edit.diagnosis') }}</label>
            <input type="text" v-model="selectedPatient.diagnosis" class="form-input">
          </div>
          <div class="form-group">
            <label>{{ t('clinicManagement.hospitalization.modals.edit.status') }}</label>
            <select v-model="selectedPatient.status" class="form-input">
              <option value="Crítico">{{ t('clinicManagement.hospitalization.status.Crítico') }}</option>
              <option value="Estable">{{ t('clinicManagement.hospitalization.status.Estable') }}</option>
              <option value="Recuperación">{{ t('clinicManagement.hospitalization.status.Recuperación') }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
            <button class="btn-primary" @click="closeModals">{{ t('clinicManagement.hospitalization.modals.save') }}</button>
          </div>
        </div>
      </div>
    </div>

    
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t('clinicManagement.hospitalization.modals.register.title') }}</h2>
          <i class="pi pi-times close-icon" @click="closeModals"></i>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.patientName') }}</label>
              <input type="text" v-model="newPatientForm.patientName" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.patientNamePlaceholder')">
            </div>
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.species') }}</label>
              <select v-model="newPatientForm.species" class="form-input">
                <option value="Perro">{{ t('clinicManagement.hospitalization.modals.register.speciesDog') }}</option>
                <option value="Gato">{{ t('clinicManagement.hospitalization.modals.register.speciesCat') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.breed') }}</label>
              <input type="text" v-model="newPatientForm.breed" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.breedPlaceholder')">
            </div>
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.age') }}</label>
              <input type="text" v-model="newPatientForm.age" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.agePlaceholder')">
            </div>
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.owner') }}</label>
              <input type="text" v-model="newPatientForm.ownerName" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.ownerPlaceholder')">
            </div>
            <div class="form-group">
              <label>{{ t('clinicManagement.hospitalization.modals.register.phone') }}</label>
              <input type="text" v-model="newPatientForm.ownerPhone" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.phonePlaceholder')">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>{{ t('clinicManagement.hospitalization.modals.register.diagnosis') }}</label>
              <input type="text" v-model="newPatientForm.diagnosis" class="form-input" :placeholder="t('clinicManagement.hospitalization.modals.register.diagnosisPlaceholder')">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>{{ t('clinicManagement.hospitalization.modals.register.status') }}</label>
              <select v-model="newPatientForm.status" class="form-input">
                <option value="Crítico">{{ t('clinicManagement.hospitalization.status.Crítico') }}</option>
                <option value="Estable">{{ t('clinicManagement.hospitalization.status.Estable') }}</option>
                <option value="Recuperación">{{ t('clinicManagement.hospitalization.status.Recuperación') }}</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
            <button class="btn-primary" @click="registerPatient">{{ t('clinicManagement.hospitalization.modals.register.submit') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hospitalizacion-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}


.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.view-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0;
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


.stats-cards-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  height: 154px;
  background-color: transparent;
}

.stats-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.10);
  box-sizing: border-box;
  flex: 1;
}

.card-row-top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.card-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.5px;
  color: #4b5563;
}

.icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-blue { background-color: #e0f2fe; }
.icon-blue { color: #0284c7; font-size: 24px; }

.badge-red { background-color: #fee2e2; }
.icon-red { color: #dc2626; font-size: 24px; }

.badge-amber { background-color: #fef3c7; }
.icon-amber { color: #d97706; font-size: 24px; }

.card-value-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.card-value {
  font-family: 'Inter', sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.5px;
  color: #111827;
}

.card-description {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.5px;
}

.desc-default { font-weight: 400; color: #6b7280; }
.desc-alert { font-weight: 500; color: #dc2626; }


.table-container {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
}

.table-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tab {
  background: transparent;
  border: none;
  border-radius: 9999px;
  padding: 8px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover:not(.active) { color: #111827; }
.filter-tab.active {
  background-color: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.patient-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.patient-table th {
  background-color: #f9fafb;
  padding: 12px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.1px;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.patient-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.patient-table tr:hover { background-color: #f9fafb; }
.patient-table tr:last-child td { border-bottom: none; }

.patient-cell { display: flex; align-items: center; gap: 12px; }
.patient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
}

.patient-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patient-initial {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 18px;
}

.dog_golden { background-color: #fef3c7; color: #d97706; }
.cat_purple { background-color: #f3e8ff; color: #9333ea; }
.dog_blue   { background-color: #dbeafe; color: #2563eb; }
.cat_pink   { background-color: #fce7f3; color: #db2777; }
.dog_green  { background-color: #dcfce7; color: #16a34a; }

.patient-text { display: flex; flex-direction: column; gap: 2px; }
.patient-name { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; color: #111827; }
.patient-subtitle { font-family: 'Inter', sans-serif; font-size: 13px; color: #6b7280; }

.owner-cell { display: flex; flex-direction: column; gap: 2px; }
.owner-name { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #1f2937; }
.owner-phone { font-family: 'Inter', sans-serif; font-size: 13px; color: #6b7280; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-critical { background-color: #fee2e2; color: #b91c1c; }
.status-critical .status-dot { background-color: #b91c1c; }
.status-stable { background-color: #dcfce7; color: #15803d; }
.status-stable .status-dot { background-color: #16a34a; }
.status-recovery { background-color: #fef9c3; color: #a16207; }
.status-recovery .status-dot { background-color: #ca8a04; }

.date-cell { display: flex; flex-direction: column; gap: 2px; }
.date-primary { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #1f2937; }
.date-secondary { font-family: 'Inter', sans-serif; font-size: 12px; color: #6b7280; }

.diagnosis-text { font-family: 'Inter', sans-serif; font-size: 14px; color: #1f2937; }
.treatment-list { display: flex; flex-direction: column; gap: 4px; }
.treatment-item { font-family: 'Inter', sans-serif; font-size: 13px; color: #374151; }

.action-buttons { display: flex; align-items: center; justify-content: center; gap: 8px; }
.action-view { font-size: 20px; color: #0284c7; cursor: pointer; transition: color 0.2s; }
.action-view:hover { color: #0369a1; }
.action-edit { font-size: 18px; color: #4b5563; cursor: pointer; transition: color 0.2s; }
.action-edit:hover { color: #111827; }


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

.pagination-btn:hover:not(.active), .pagination-nav-btn:hover:not(.disabled-btn) {
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


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(17, 24, 39, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h2 { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
.close-icon { color: #6b7280; cursor: pointer; font-size: 16px; transition: color 0.2s; }
.close-icon:hover { color: #111827; }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-group label { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #4b5563; display: block; margin-bottom: 4px; }
.detail-group p { font-family: 'Inter', sans-serif; font-size: 14px; color: #111827; margin: 0; }
.detail-group ul { margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #111827; }
.form-group label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #374151; display: block; margin-bottom: 8px; }
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #111827;
  box-sizing: border-box;
}
.form-input:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.btn-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background-color: #f9fafb; }



.tracking-tasks-row {
  display: flex;
  gap: 24px;
  width: 100%;
  flex-wrap: wrap;
}


.tracking-card {
  flex: 1;
  min-width: 400px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04);
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.header-icon { color: #0284c7; font-size: 22px; }
.header-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.5px;
  color: #111827;
  margin: 0;
}

.tracking-list { display: flex; flex-direction: column; gap: 0; }
.tracking-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.tracking-item:last-child { border-bottom: none; }

.item-left { display: flex; align-items: flex-start; gap: 12px; }
.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  overflow: hidden;
}

.variant-temperature { background-color: #e0f2fe; color: #0284c7; }
.variant-medication { background-color: #dcfce7; color: #16a34a; }
.variant-food { background-color: #fef3c7; color: #d97706; }
.variant-vitals { background-color: #f3e8ff; color: #9333ea; }

.text-group { display: flex; flex-direction: column; gap: 2px; }
.item-title { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; line-height: 22px; color: #111827; }
.item-subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; letter-spacing: -0.5px; color: #4b5563; }
.item-author { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; line-height: 16px; color: #6b7280; }

.item-right { display: flex; align-items: flex-start; }
.item-time { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 13px; line-height: 18px; color: #6b7280; }


.tasks-widget {
  flex: 1;
  min-width: 400px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tasks-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.tasks-header-icon { color: #0284c7; font-size: 22px; }
.tasks-header-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.5px;
  color: #111827;
  margin: 0;
}

.tasks-list { display: flex; flex-direction: column; gap: 16px; }
.task-card {
  position: relative;
  border-radius: 10px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
}

.task-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.task-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  width: 100%;
  margin-left: 4px; 
}

.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  background-color: #ffffff;
  margin-top: 2px;
  flex-shrink: 0;
}

.task-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.task-title { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; line-height: 22px; letter-spacing: -0.2px; color: #111827; }
.task-subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 13px; line-height: 20px; color: #6b7280; }

.task-footer { display: flex; align-items: center; gap: 8px; }
.task-badge {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.2px;
  padding: 3px 8px;
  border-radius: 6px;
}
.task-time { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; line-height: 16px; color: #6b7280; }


.task-urgent { background-color: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.3); }
.task-urgent .task-accent-bar { background-color: #ef4444; }
.badge-urgent { background-color: #fee2e2; color: #b91c1c; }

.task-today { background-color: #fffbeb; border: 1px solid rgba(245, 158, 11, 0.3); }
.task-today .task-accent-bar { background-color: #f59e0b; }
.badge-today { background-color: #fef3c7; color: #b45309; }

.task-scheduled { background-color: #f0fdf4; border: 1px solid rgba(34, 197, 94, 0.3); }
.task-scheduled .task-accent-bar { background-color: #22c55e; }
.badge-scheduled { background-color: #dcfce7; color: #15803d; }

.task-tomorrow { background-color: #eff6ff; border: 1px solid rgba(59, 130, 246, 0.3); }
.task-tomorrow .task-accent-bar { background-color: #3b82f6; }
.badge-tomorrow { background-color: #dbeafe; color: #1d4ed8; }
</style>
