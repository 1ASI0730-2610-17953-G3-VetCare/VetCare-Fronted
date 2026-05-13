<template>
  <div class="perfil-container">

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('profile.loading') }}</p>
    </div>

    <div v-else class="perfil-layout">
            <div class="perfil-main">
        
                <div class="section-card profile-header-card">
          <div class="profile-header-content">
            <div class="avatar-wrapper">
              <div class="avatar">{{ iniciales }}</div>
              <button class="badge-icon" :title="$t('profile.sidebar.changePhoto')"><i class="pi pi-camera"></i></button>
            </div>
            <div class="info-layout">
              <h2 class="user-name-large">{{ perfil.nombre }} {{ perfil.apellidos }}</h2>
              <p class="user-role-large">{{ perfil.especialidad }}</p>
            </div>
            <div class="membership-badge">
              <span class="badge-label">{{ $t('profile.sidebar.memberSince') }}</span>
              <span class="badge-value">Oct 2023</span>
            </div>
          </div>
        </div>

                <div class="section-card">
          <div class="card-header">
            <div class="header-icon">
              <i class="pi pi-user"></i>
            </div>
            <div class="header-text">
              <h2 class="card-title">{{ $t('profile.personalData.title') }}</h2>
              <p class="card-subtitle">{{ $t('profile.personalData.subtitle') }}</p>
            </div>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-control">
                <label>{{ $t('profile.personalData.name') }}</label>
                <input type="text" v-model="perfil.nombre" class="vet-input" />
              </div>
              <div class="form-control">
                <label>{{ $t('profile.personalData.lastName') }}</label>
                <input type="text" v-model="perfil.apellidos" class="vet-input" />
              </div>
              <div class="form-control">
                <label>{{ $t('profile.personalData.email') }}</label>
                <input type="email" v-model="perfil.correoElectronico" class="vet-input" />
              </div>
              <div class="form-control">
                <label>{{ $t('profile.personalData.phone') }}</label>
                <input type="tel" v-model="perfil.telefono" class="vet-input" />
              </div>
              <div class="form-control">
                <label>{{ $t('profile.personalData.specialty') }}</label>
                <input type="text" v-model="perfil.especialidad" class="vet-input" />
              </div>
              <div class="form-control">
                <label>{{ $t('profile.personalData.dni') }}</label>
                <input type="text" v-model="perfil.dni" class="vet-input" />
              </div>
            </div>
            <div class="card-actions" style="margin-top: 24px;">
              <button class="vet-btn-primary" @click="guardarCambios" :disabled="saving">
                <i v-if="saving" class="pi pi-spinner pi-spin btn-icon"></i>
                <i v-else class="pi pi-save btn-icon"></i>
                <span v-if="saving">{{ $t('profile.saveButton.saving') }}</span>
                <span v-else>{{ $t('profile.saveButton.default') }}</span>
              </button>
            </div>
          </div>
        </div>

                <div class="section-card">
          <div class="card-header">
            <div class="header-icon icon-red">
              <i class="pi pi-lock"></i>
            </div>
            <div class="header-text">
              <h2 class="card-title">{{ $t('profile.security.title') }}</h2>
              <p class="card-subtitle">{{ $t('profile.security.subtitle') }}</p>
            </div>
          </div>
          <div class="card-body">
            <div class="form-grid-single">
              <div class="form-control">
                <label>{{ $t('profile.security.currentPassword') }}</label>
                <div class="password-wrapper">
                  <input :type="showPassword.actual ? 'text' : 'password'" :placeholder="$t('profile.security.currentPasswordPlaceholder')" class="vet-input w-full" />
                  <i :class="showPassword.actual ? 'pi pi-eye-slash' : 'pi pi-eye'" @click="showPassword.actual = !showPassword.actual" class="password-toggle"></i>
                </div>
              </div>
              <div class="form-control">
                <label>{{ $t('profile.security.newPassword') }}</label>
                <div class="password-wrapper">
                  <input :type="showPassword.nueva ? 'text' : 'password'" :placeholder="$t('profile.security.newPasswordPlaceholder')" class="vet-input w-full" />
                  <i :class="showPassword.nueva ? 'pi pi-eye-slash' : 'pi pi-eye'" @click="showPassword.nueva = !showPassword.nueva" class="password-toggle"></i>
                </div>
              </div>
              <div class="form-control">
                <label>{{ $t('profile.security.confirmPassword') }}</label>
                <div class="password-wrapper">
                  <input :type="showPassword.confirmar ? 'text' : 'password'" :placeholder="$t('profile.security.confirmPasswordPlaceholder')" class="vet-input w-full" />
                  <i :class="showPassword.confirmar ? 'pi pi-eye-slash' : 'pi pi-eye'" @click="showPassword.confirmar = !showPassword.confirmar" class="password-toggle"></i>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <button class="vet-btn-danger">
                <i class="pi pi-key btn-icon"></i>
                <span>{{ $t('profile.security.updateButton') }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

            <div class="perfil-sidebar">
        
                <div class="section-card">
          <div class="card-header">
            <div class="header-icon icon-purple">
              <i class="pi pi-cog"></i>
            </div>
            <div class="header-text">
              <h2 class="card-title">{{ $t('profile.preferences.title') }}</h2>
              <p class="card-subtitle">{{ $t('profile.preferences.subtitle') }}</p>
            </div>
          </div>
          <div class="card-body">
            <div class="preferences-list">
              <div class="preference-item">
                <div>
                  <span class="pref-name">{{ $t('profile.preferences.emailNotifications.name') }}</span>
                  <span class="pref-desc">{{ $t('profile.preferences.emailNotifications.desc') }}</span>
                </div>
                <label class="custom-toggle">
                  <input type="checkbox" v-model="perfil.notificacionesEmail">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </div>
              <div class="preference-item">
                <div>
                  <span class="pref-name">{{ $t('profile.preferences.pushNotifications.name') }}</span>
                  <span class="pref-desc">{{ $t('profile.preferences.pushNotifications.desc') }}</span>
                </div>
                <label class="custom-toggle">
                  <input type="checkbox" v-model="perfil.notificacionesPush">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </div>
              <div class="preference-item">
                <div>
                  <span class="pref-name">{{ $t('profile.preferences.appointmentReminders.name') }}</span>
                  <span class="pref-desc">{{ $t('profile.preferences.appointmentReminders.desc') }}</span>
                </div>
                <label class="custom-toggle">
                  <input type="checkbox" v-model="perfil.recordatoriosCitas">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </div>
              <div class="preference-item">
                <div>
                  <span class="pref-name">{{ $t('profile.preferences.darkMode.name') }}</span>
                  <span class="pref-desc">{{ $t('profile.preferences.darkMode.desc') }}</span>
                </div>
                <label class="custom-toggle">
                  <input type="checkbox" v-model="perfil.modoOscuro">
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </div>
            </div>
          </div>
        </div>

                <div class="stats-card">
          <div class="stats-header">
            <h3 class="stats-title">{{ $t('profile.sidebar.productivity.title') }}</h3>
            <i class="pi pi-chart-line stats-icon"></i>
          </div>
          <div class="stats-metrics">
            <div class="stat-group">
              <span class="stat-val">{{ perfil.citasEsteMes }}</span>
              <span class="stat-lbl">{{ $t('profile.sidebar.productivity.appointments') }}</span>
            </div>
            <div class="stat-group">
              <span class="stat-val">{{ perfil.pacientesAtendidos }}</span>
              <span class="stat-lbl">{{ $t('profile.sidebar.productivity.patients') }}</span>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-labels">
              <span>{{ $t('profile.sidebar.productivity.monthlyGoal') }}</span>
              <span>85%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: 85%"></div>
            </div>
          </div>
        </div>

                <div class="section-card mt-4">
          <div class="card-header">
            <h2 class="card-title" style="font-size: 16px;">{{ $t('profile.sidebar.accountOptions.title') }}</h2>
          </div>
          <div class="card-body">
            <ul class="action-list">
              <li class="action-item">
                <i class="pi pi-file-export action-icon"></i>
                <span>{{ $t('profile.sidebar.accountOptions.exportData') }}</span>
              </li>
              <li class="action-item">
                <i class="pi pi-question-circle action-icon"></i>
                <span>{{ $t('profile.sidebar.accountOptions.helpCenter') }}</span>
              </li>
              <li class="action-item danger-item">
                <i class="pi pi-trash action-icon"></i>
                <span>{{ $t('profile.sidebar.accountOptions.deleteAccount') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PerfilApi } from '../../infrastructure/perfil-api.js';
import { PerfilEntity } from '../../domain/perfil.entity.js';

const { t } = useI18n();
const api = new PerfilApi();
const loading = ref(true);
const saving = ref(false);
const perfil = ref(new PerfilEntity({}));

const showPassword = ref({
  actual: false,
  nueva: false,
  confirmar: false
});

const iniciales = computed(() => {
  const n = perfil.value.nombre ? perfil.value.nombre.charAt(0) : '';
  const a = perfil.value.apellidos ? perfil.value.apellidos.charAt(0) : '';
  return (n + a).toUpperCase() || 'V';
});

const cargarDatos = async () => {
  try {
    loading.value = true;
    const data = await api.getPerfil();
    perfil.value = new PerfilEntity(data);
  } catch (error) {
    console.error("Error cargando perfil:", error);
  } finally {
    loading.value = false;
  }
};

const guardarCambios = async () => {
  try {
    saving.value = true;
    const rawData = {
      id: perfil.value.id,
      datosPersonales: {
        nombre: perfil.value.nombre,
        apellidos: perfil.value.apellidos,
        correoElectronico: perfil.value.correoElectronico,
        telefono: perfil.value.telefono,
        especialidad: perfil.value.especialidad,
        dni: perfil.value.dni
      },
      preferencias: {
        notificacionesEmail: perfil.value.notificacionesEmail,
        notificacionesPush: perfil.value.notificacionesPush,
        recordatoriosCitas: perfil.value.recordatoriosCitas,
        modoOscuro: perfil.value.modoOscuro,
        sonidosSistema: perfil.value.sonidosSistema
      },
      actividad: {
        citasEsteMes: perfil.value.citasEsteMes,
        pacientesAtendidos: perfil.value.pacientesAtendidos
      }
    };
    await api.updatePerfil(rawData);
    alert(t('profile.saveButton.success'));
  } catch (error) {
    console.error("Error guardando perfil:", error);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
:root {
  --color-bg-surface: #FFFFFF;
  --color-border-light: #E2E8F0;
  --color-primary-main: #0369A1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #4B5563;
  --color-text-muted: #64748B;
}

.perfil-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.perfil-header-page {
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary, #0F172A);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: var(--color-text-muted, #64748B);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  color: var(--color-primary-main, #0369A1);
}

.spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(3, 105, 161, 0.2);
  border-top-color: var(--color-primary-main, #0369A1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.perfil-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}
@media (max-width: 1024px) {
  .perfil-layout { grid-template-columns: 1fr; }
}

.section-card {
  background-color: var(--color-bg-surface, #FFFFFF);
  border: 1px solid var(--color-border-light, #E2E8F0);
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-light, #E2E8F0);
}

.header-icon {
  background-color: rgba(14, 165, 233, 0.1);
  color: var(--color-primary-main, #0369A1);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.header-icon.icon-red {
  background-color: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.header-icon.icon-purple {
  background-color: rgba(168, 85, 247, 0.1);
  color: #A855F7;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.card-body {
  padding: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #0F172A);
  margin: 0;
}

.card-subtitle {
  font-size: 14px;
  color: var(--color-text-muted, #64748B);
  margin: 4px 0 0 0;
}

.profile-header-card {
  padding: 24px;
}
.profile-header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}
.avatar-wrapper {
  position: relative;
  margin-right: 24px;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 9999px; 
  background: #E0F2FE;
  color: #0369A1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}
.badge-icon {
  position: absolute;
  bottom: 0; right: 0;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #E2E8F0;
  display: flex; align-items: center; justify-content: center;
  color: #64748B;
  cursor: pointer;
  font-size: 12px;
}
.info-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.user-name-large {
  font-size: 20px; font-weight: 700; margin: 0 0 4px 0; color: #0F172A;
}
.user-role-large {
  font-size: 14px; color: #64748B; margin: 0;
}
.membership-badge {
  position: absolute;
  top: 0; right: 0;
  display: flex; flex-direction: column; align-items: flex-end;
}
.badge-label { font-size: 12px; color: #4B5563; }
.badge-value { font-size: 14px; font-weight: 700; color: #0F172A; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

.form-grid-single {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.w-full {
  width: 100%;
}
.password-toggle {
  position: absolute;
  right: 12px;
  color: var(--color-text-muted, #64748B);
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
}
.password-toggle:hover {
  color: var(--color-primary-main, #0369A1);
}
.form-control {
  display: flex;
  flex-direction: column;
}
.form-control label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #0F172A);
  margin-bottom: 8px;
}
.vet-input {
  height: 44px;
  background-color: var(--color-bg-surface, #FFFFFF);
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--color-text-primary, #0F172A);
  transition: border-color 0.2s;
}
.vet-input::placeholder { color: var(--color-text-muted, #64748B); }
.vet-input:focus {
  outline: none;
  border-color: var(--color-primary-main, #0369A1);
}

.card-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
.page-actions { display: flex; justify-content: flex-end; margin-top: 16px; }
.vet-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-main, #0369A1);
  color: #FFF; border: none; border-radius: 8px; padding: 10px 24px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.btn-icon {
  margin-right: 8px;
}
.btn-icon-right {
  margin-left: 8px;
}
.vet-btn-primary:hover { opacity: 0.9; }
.vet-btn-secondary {
  background-color: transparent;
  color: var(--color-primary-main, #0369A1);
  border: 1px solid var(--color-primary-main, #0369A1);
  border-radius: 8px; padding: 8px 16px; font-weight: 600; cursor: pointer;
}
.vet-btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #EF4444;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.vet-btn-danger:hover { opacity: 0.9; }

.preferences-list { display: flex; flex-direction: column; gap: 16px; }
.preference-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F1F5F9; }
.preference-item:last-child { border-bottom: none; }
.pref-name { display: block; font-size: 14px; font-weight: 600; color: #0F172A; }
.pref-desc { display: block; font-size: 12px; color: #64748B; margin-top: 4px; }

.custom-toggle {
  position: relative; display: inline-block; cursor: pointer;
}
.custom-toggle input { display: none; }
.toggle-track {
  display: block; width: 44px; height: 22px; background: #E2E8F0; border-radius: 22px; transition: 0.3s; position: relative;
}
.toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #FFFFFF; border-radius: 50%; transition: 0.3s;
}
.custom-toggle input:checked + .toggle-track { background: var(--color-primary-main, #0369A1); }
.custom-toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(22px); }

.stats-card {
  background-color: #0EA5E9;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.stats-title { font-size: 16px; font-weight: 600; margin: 0; color: #FFFFFF; }
.stats-icon { font-size: 20px; opacity: 0.9; }
.stats-metrics { display: flex; justify-content: space-between; margin-bottom: 24px; }
.stat-group { display: flex; flex-direction: column; }
.stat-val { font-size: 28px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.stat-lbl { font-size: 13px; opacity: 0.9; }

.progress-section { display: flex; flex-direction: column; gap: 8px; }
.progress-labels { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; }
.progress-track { width: 100%; height: 6px; background-color: rgba(255,255,255,0.3); border-radius: 9999px; }
.progress-fill { height: 100%; background-color: #FFFFFF; border-radius: 9999px; }

.mt-4 { margin-top: 16px; }
.action-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.action-item {
  display: flex; align-items: center; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #334155; cursor: pointer; transition: background 0.2s;
}
.action-item:hover { background-color: #F8FAFC; }
.action-icon { font-size: 18px; margin-right: 12px; color: #64748B; }

.danger-item { background-color: #FFF1F2; color: #E11D48; }
.danger-item:hover { background-color: #FFE4E6; }
.danger-item .action-icon { color: #E11D48; }
</style>
