<script setup>
import { onMounted, ref, computed } from 'vue';
import { useAdminDateLabel } from '@/shared/presentation/composables/use-admin-date-label.js';
import { BaseApi } from '@/shared/infrastructure/base-api.js';

const { adminDateLabel } = useAdminDateLabel();

const users = ref([]);
const isLoading = ref(false);
const loadError = ref('');

const showModal = ref(false);
const isSaving = ref(false);
const formError = ref('');

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const form = ref({ name: '', lastName: '', email: '', password: '', role: 'veterinario' });

const searchQuery = ref('');

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.lastName.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );
});

const displayToast = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3500);
};

const loadUsers = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    const res = await BaseApi.get('/auth/users');
    users.value = res.data ?? [];
  } catch {
    loadError.value = 'No se pudieron cargar los usuarios.';
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  form.value = { name: '', lastName: '', email: '', password: '', role: 'veterinario' };
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveUser = async () => {
  formError.value = '';
  if (!form.value.name.trim() || !form.value.lastName.trim() || !form.value.email.trim() || !form.value.password.trim()) {
    formError.value = 'Todos los campos son obligatorios.';
    return;
  }
  isSaving.value = true;
  try {
    await BaseApi.post('/auth/register', {
      name: form.value.name.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email.trim(),
      password: form.value.password.trim(),
      role: form.value.role
    });
    displayToast('Usuario creado correctamente.');
    closeModal();
    await loadUsers();
  } catch (err) {
    formError.value = err?.response?.data?.message ?? 'Error al crear el usuario.';
  } finally {
    isSaving.value = false;
  }
};

const roleLabel = (role) => role === 'admin' ? 'Administrador' : 'Veterinario';
const roleClass = (role) => role === 'admin' ? 'badge-admin' : 'badge-vet';
const avatarInitials = (u) => `${u.name?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();

onMounted(loadUsers);
</script>

<template>
  <div class="u-page">
    <Transition name="toast">
      <div v-if="showToast" :class="['u-toast', `u-toast--${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <header class="u-header">
      <p class="u-eyebrow">{{ adminDateLabel }}</p>
      <h1 class="u-title">Gestión de Usuarios</h1>
    </header>

    <div class="u-toolbar">
      <div class="u-search-wrapper">
        <i class="pi pi-search u-search-icon"></i>
        <input v-model="searchQuery" type="text" placeholder="Buscar por nombre, email o rol..." class="u-search" />
      </div>
      <button class="u-btn-add" @click="openModal">
        <i class="pi pi-plus"></i> Nuevo usuario
      </button>
    </div>

    <div class="u-card">
      <div v-if="isLoading" class="u-state-center">
        <i class="pi pi-spin pi-spinner u-spinner"></i>
        <span>Cargando usuarios...</span>
      </div>
      <div v-else-if="loadError" class="u-state-center u-state-error">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ loadError }}</span>
      </div>
      <div v-else>
        <table class="u-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="3" class="u-empty">No hay usuarios registrados.</td>
            </tr>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td>
                <div class="u-user-cell">
                  <div class="u-avatar">{{ avatarInitials(u) }}</div>
                  <div>
                    <span class="u-name">{{ u.name }} {{ u.lastName }}</span>
                  </div>
                </div>
              </td>
              <td class="u-email">{{ u.email }}</td>
              <td>
                <span :class="['u-badge', roleClass(u.role)]">{{ roleLabel(u.role) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showModal" class="u-overlay" @click.self="closeModal">
        <div class="u-modal">
          <div class="u-modal-header">
            <div class="u-modal-icon"><i class="pi pi-user-plus"></i></div>
            <div>
              <h2 class="u-modal-title">Nuevo usuario</h2>
              <p class="u-modal-sub">Completa los datos para crear una cuenta</p>
            </div>
            <button class="u-modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="u-form" @submit.prevent="saveUser">
            <div class="u-form-row">
              <div class="u-field">
                <label>Nombre *</label>
                <input v-model="form.name" type="text" placeholder="Ej: María" />
              </div>
              <div class="u-field">
                <label>Apellido *</label>
                <input v-model="form.lastName" type="text" placeholder="Ej: García" />
              </div>
            </div>
            <div class="u-field">
              <label>Correo electrónico *</label>
              <input v-model="form.email" type="email" placeholder="correo@clinica.com" />
            </div>
            <div class="u-field">
              <label>Contraseña *</label>
              <input v-model="form.password" type="password" placeholder="Mínimo 6 caracteres" />
            </div>
            <div class="u-field">
              <label>Rol *</label>
              <select v-model="form.role">
                <option value="veterinario">Veterinario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <p v-if="formError" class="u-form-error">{{ formError }}</p>

            <div class="u-modal-actions">
              <button type="button" class="u-btn-cancel" @click="closeModal">Cancelar</button>
              <button type="submit" class="u-btn-save" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? 'Guardando...' : 'Crear usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.u-page { padding: 2rem; max-width: 960px; margin: 0 auto; }

.u-header { margin-bottom: 1.5rem; }
.u-eyebrow { font-size: 0.75rem; font-weight: 600; color: #0f766e; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .25rem; }
.u-title { font-size: 1.75rem; font-weight: 700; color: #0f172a; }

.u-toolbar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
.u-search-wrapper { position: relative; flex: 1; min-width: 200px; }
.u-search-icon { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: .875rem; }
.u-search { width: 100%; height: 38px; padding: 0 .75rem 0 2.25rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .875rem; color: #0f172a; background: #fff; outline: none; box-sizing: border-box; }
.u-search:focus { border-color: #0f766e; }
.u-btn-add { height: 38px; padding: 0 1.25rem; background: #0f766e; color: #fff; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: .5rem; white-space: nowrap; }
.u-btn-add:hover { background: #0d5f57; }

.u-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }

.u-state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; padding: 3rem; color: #64748b; font-size: .9rem; }
.u-spinner { font-size: 1.5rem; color: #0f766e; }
.u-state-error { color: #b91c1c; }

.u-table { width: 100%; border-collapse: collapse; }
.u-table thead { background: #f8fafc; }
.u-table th { padding: .75rem 1rem; text-align: left; font-size: .75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e2e8f0; }
.u-table td { padding: .875rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: .875rem; color: #334155; vertical-align: middle; }
.u-table tr:last-child td { border-bottom: none; }
.u-table tr:hover td { background: #f8fafc; }

.u-user-cell { display: flex; align-items: center; gap: .75rem; }
.u-avatar { width: 36px; height: 36px; border-radius: 50%; background: #0f766e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 700; flex-shrink: 0; }
.u-name { font-weight: 600; color: #0f172a; }
.u-email { color: #64748b; }
.u-empty { text-align: center; color: #94a3b8; padding: 2.5rem !important; }

.u-badge { display: inline-flex; align-items: center; padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; }
.badge-admin { background: #fef3c7; color: #92400e; }
.badge-vet { background: #d1fae5; color: #065f46; }

/* Modal */
.u-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.u-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.15); overflow: hidden; }
.u-modal-header { display: flex; align-items: flex-start; gap: 1rem; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
.u-modal-icon { width: 42px; height: 42px; border-radius: 10px; background: #ccfbf1; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.u-modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.u-modal-sub { font-size: .8rem; color: #64748b; }
.u-modal-close { margin-left: auto; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: .25rem; }
.u-modal-close:hover { color: #0f172a; }

.u-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.u-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.u-field { display: flex; flex-direction: column; gap: .35rem; }
.u-field label { font-size: .8rem; font-weight: 600; color: #374151; }
.u-field input, .u-field select { height: 38px; padding: 0 .75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .875rem; color: #0f172a; outline: none; background: #fff; }
.u-field input:focus, .u-field select:focus { border-color: #0f766e; }

.u-form-error { font-size: .8rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: .5rem .75rem; }

.u-modal-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .5rem; }
.u-btn-cancel { height: 38px; padding: 0 1.25rem; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; }
.u-btn-cancel:hover { background: #e2e8f0; }
.u-btn-save { height: 38px; padding: 0 1.25rem; background: #0f766e; color: #fff; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: .5rem; }
.u-btn-save:disabled { opacity: .6; cursor: not-allowed; }
.u-btn-save:not(:disabled):hover { background: #0d5f57; }

/* Toast */
.u-toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 300; display: flex; align-items: center; gap: .75rem; padding: .75rem 1.25rem; border-radius: 10px; font-size: .875rem; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,.12); }
.u-toast--success { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
.u-toast--error { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }

.toast-enter-active, .toast-leave-active { transition: all .3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
