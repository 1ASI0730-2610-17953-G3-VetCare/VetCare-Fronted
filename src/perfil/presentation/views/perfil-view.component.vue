<template>
  <div class="perfil-container">

  <PageViewLoading
    v-if="loading"
    variant="profile"
    :message="$t('profile.loading')"
  />

    <div v-else class="perfil-layout">
            <div class="perfil-main">
        
                <div class="section-card profile-header-card">
          <div class="profile-header-content">
            <div class="avatar-wrapper">
              <UserAvatar
                :avatar-url="perfil.avatarUrl"
                :nombre="headerNombre"
                :apellidos="headerApellidos"
                :cache-key="iamStore.avatarVersion"
                size="md"
              />
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/png,image/jpeg"
                hidden
                @change="onAvatarSelected"
              />
              <button
                class="badge-icon"
                type="button"
                :title="$t('profile.sidebar.changePhoto')"
                :disabled="uploadingAvatar"
                @click="avatarInputRef?.click()"
              >
                <i :class="uploadingAvatar ? 'pi pi-spinner pi-spin' : 'pi pi-camera'"></i>
              </button>
            </div>
            <div class="info-layout">
              <h2 class="user-name-large">{{ headerNombre }} {{ headerApellidos }}</h2>
              <p class="user-role-large">{{ headerRol }}</p>
            </div>
            <div class="membership-badge">
              <i class="pi pi-id-card membership-icon" aria-hidden="true"></i>
              <div class="membership-text">
                <span class="badge-label">{{ $t('profile.sidebar.memberSince') }}</span>
                <span class="badge-value">Oct 2023</span>
              </div>
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
            <div class="card-actions card-actions--spaced">
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
              <span>{{ perfil.metaMensualPorcentaje }}%</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${Math.min(100, perfil.metaMensualPorcentaje)}%` }"
              ></div>
            </div>
          </div>
        </div>

                <div class="section-card section-card--compact">
          <div class="card-header card-header--compact">
            <h2 class="card-title card-title--sm">{{ $t('profile.sidebar.accountOptions.title') }}</h2>
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
import { ref, onMounted, onActivated, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PerfilApi } from '../../infrastructure/perfil-api.js';
import { PerfilEntity } from '../../domain/perfil.entity.js';
import UserAvatar from '@/shared/presentation/components/user-avatar.component.vue';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';
import { useIamStore } from '@/iam/application/iam.store.js';

const { t } = useI18n();
const api = new PerfilApi();
const iamStore = useIamStore();
const loading = ref(true);
const saving = ref(false);
const uploadingAvatar = ref(false);
const avatarInputRef = ref(null);
const perfil = ref(new PerfilEntity({}));

const headerNombre = computed(() => perfil.value.nombre || iamStore.user?.nombre || '');
const headerApellidos = computed(() => perfil.value.apellidos || iamStore.user?.apellidos || '');
const headerRol = computed(() => perfil.value.especialidad || t('layout.userRole'));

const hydrateFromSession = () => {
  const user = iamStore.user;
  if (!user) return;

  if (!perfil.value.nombre) perfil.value.nombre = user.nombre ?? '';
  if (!perfil.value.apellidos) perfil.value.apellidos = user.apellidos ?? '';
  if (!perfil.value.correoElectronico) perfil.value.correoElectronico = user.email ?? '';
  if (!perfil.value.especialidad) perfil.value.especialidad = t('layout.userRole');
};

const showPassword = ref({
  actual: false,
  nueva: false,
  confirmar: false
});

const onAvatarSelected = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    alert(t('profile.sidebar.invalidAvatarType'));
    event.target.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert(t('profile.sidebar.avatarTooLarge'));
    event.target.value = '';
    return;
  }

  try {
    uploadingAvatar.value = true;
    const avatarUrl = await api.uploadAvatar(file);
    perfil.value.avatarUrl = avatarUrl;
    iamStore.setAvatarUrl(avatarUrl);
    alert(t('profile.sidebar.avatarUploadSuccess'));
  } catch (error) {
    console.error('Error uploading avatar:', error);
    alert(t('profile.sidebar.avatarUploadError'));
  } finally {
    uploadingAvatar.value = false;
    event.target.value = '';
  }
};

const cargarDatos = async () => {
  hydrateFromSession();
  try {
    loading.value = true;
    const data = await api.getPerfil(iamStore.user);
    perfil.value = new PerfilEntity(data);
    hydrateFromSession();
    if (data.avatarUrl) {
      iamStore.setAvatarUrl(data.avatarUrl);
    }
  } catch (error) {
    console.error("Error cargando perfil:", error);
    hydrateFromSession();
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
        pacientesAtendidos: perfil.value.pacientesAtendidos,
        metaMensualPorcentaje: perfil.value.metaMensualPorcentaje
      }
    };
    await api.updatePerfil(rawData, iamStore.user);
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

onActivated(() => {
  cargarDatos();
});
</script>

<style scoped>
.perfil-container {
  display: flex;
  flex-direction: column;
  margin: -24px;
  width: calc(100% + 48px);
  min-height: calc(100vh - 128px);
  padding: 24px;
  background:
    radial-gradient(
      color-mix(in srgb, var(--color-primary-main) 5%, transparent) 1px,
      transparent 1px
    ) 0 0 / 24px 24px,
    var(--color-background-main);
}

.perfil-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .perfil-layout { grid-template-columns: 1fr; }
  .perfil-container {
    margin: 0;
    width: 100%;
    min-height: 0;
    padding: 0;
    background: var(--color-background-main);
  }
}

.section-card {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.section-card--compact {
  margin-bottom: 0;
}

.card-header {
  padding: 18px 24px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border-bottom: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-sidebar) 45%, var(--color-background-surface));
}

.card-header--compact {
  padding: 16px 20px;
  border-bottom: none;
  background: transparent;
}

.header-icon {
  background-color: var(--color-primary-subtle);
  color: var(--color-primary-main);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.header-icon.icon-red {
  background-color: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
}

.header-icon.icon-purple {
  background-color: var(--color-status-info-bg);
  color: var(--color-status-info-text);
}

.header-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-body {
  padding: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.card-title--sm {
  font-size: 16px;
}

.card-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.profile-header-card {
  padding: 0;
  margin-bottom: 24px;
}

.profile-header-card .profile-header-content {
  padding: 24px;
  background: color-mix(in srgb, var(--color-primary-subtle) 28%, var(--color-background-surface));
}

.profile-header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrapper :deep(.user-avatar) {
  box-shadow:
    0 0 0 4px var(--color-background-surface),
    0 0 0 5px color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
}

.badge-icon {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-main);
  cursor: pointer;
  font-size: 12px;
  box-shadow: var(--shadow-card);
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.badge-icon:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-primary-main) 35%, var(--color-border-light));
  background: var(--color-primary-subtle);
}

.badge-icon:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.badge-icon:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.info-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.user-name-large {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--color-text-primary);
}

.user-role-large {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.membership-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-left: auto;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 12%, var(--color-border-light));
  border-radius: 12px;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-text-primary) 4%, transparent);
}

.membership-icon {
  font-size: 16px;
  color: var(--color-primary-main);
  flex-shrink: 0;
}

.membership-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.badge-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.badge-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .membership-badge {
    margin-left: 0;
    width: 100%;
  }
}

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
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: var(--color-primary-main);
}

.form-control {
  display: flex;
  flex-direction: column;
}

.form-control label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.vet-input {
  height: 44px;
  background-color: var(--color-background-sidebar);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.vet-input::placeholder {
  color: var(--color-text-muted);
}

.vet-input:focus {
  outline: none;
  border-color: var(--color-primary-main);
  background-color: var(--color-background-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 12%, transparent);
}

.card-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.card-actions--spaced {
  margin-top: 24px;
}

.vet-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary-main) 24%, transparent);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-icon {
  margin-right: 0;
}

.vet-btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.vet-btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.vet-btn-primary:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.vet-btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--color-status-danger-indicator);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.vet-btn-danger:hover {
  opacity: 0.92;
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-sidebar) 50%, var(--color-background-surface));
  transition: border-color 0.2s ease;
}

.preference-item:hover {
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
}

.pref-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.pref-desc {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.custom-toggle {
  position: relative;
  display: inline-block;
  cursor: pointer;
  flex-shrink: 0;
}

.custom-toggle input {
  display: none;
}

.toggle-track {
  display: block;
  width: 44px;
  height: 24px;
  background: var(--color-border-light);
  border-radius: 999px;
  transition: background 0.25s ease;
  position: relative;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--color-background-surface);
  border-radius: 50%;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--color-text-primary) 12%, transparent);
  transition: transform 0.25s ease;
}

.custom-toggle input:checked + .toggle-track {
  background: var(--color-primary-main);
}

.custom-toggle input:checked + .toggle-track .toggle-thumb {
  transform: translateX(20px);
}

.custom-toggle input:focus-visible + .toggle-track {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.stats-card {
  background: linear-gradient(
    145deg,
    var(--color-primary-main) 0%,
    color-mix(in srgb, var(--color-status-success-indicator) 75%, var(--color-primary-main)) 100%
  );
  color: var(--color-primary-contrastText);
  border-radius: 16px;
  padding: 22px 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary-main) 22%, transparent);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-primary-contrastText);
}

.stats-icon {
  font-size: 18px;
  opacity: 0.9;
  padding: 8px;
  border-radius: 8px;
  background: color-mix(in srgb, white 14%, transparent);
}

.stats-metrics {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.stat-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, white 10%, transparent);
  border: 1px solid color-mix(in srgb, white 16%, transparent);
}

.stat-val {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-lbl {
  font-size: 13px;
  opacity: 0.92;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
}

.progress-track {
  width: 100%;
  height: 8px;
  background-color: color-mix(in srgb, white 22%, transparent);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary-contrastText);
  border-radius: 999px;
}

.action-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.action-item:hover {
  background-color: var(--color-background-sidebar);
  border-color: var(--color-border-light);
}

.action-icon {
  font-size: 16px;
  margin-right: 12px;
  color: var(--color-primary-main);
  flex-shrink: 0;
}

.danger-item {
  background-color: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 16%, transparent);
}

.danger-item:hover {
  background-color: color-mix(in srgb, var(--color-status-danger-bg) 80%, var(--color-status-danger-indicator));
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 28%, transparent);
}

.danger-item .action-icon {
  color: var(--color-status-danger-indicator);
}
</style>
