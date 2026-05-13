<template>
  <div class="login-screen">
    
    <div class="left-panel">
      <div class="content-wrapper">
        
        
        <div class="logo-block">
          <div class="logo-icon">
            <i class="pi pi-paw"></i>
          </div>
          <div class="logo-text">
            <h1 class="app-title">VetCare Pro</h1>
            <p class="app-subtitle">Sistema de Gestión Veterinaria</p>
          </div>
        </div>

        
        <div class="form-card">
          <div class="heading-block">
            <h2 class="section-heading">Iniciar Sesión</h2>
            <p class="body-regular">Accede a tu cuenta profesional</p>
          </div>

          <form @submit.prevent="handleLogin" class="form-fields">
            
            <div class="input-group">
              <label class="label">Correo Electrónico</label>
              <div class="input-wrapper" :class="{ 'error': v$.email.$error, 'focus': emailFocus }">
                <i class="pi pi-envelope icon-left"></i>
                <input 
                  type="email" 
                  v-model="state.email" 
                  placeholder="doctor@veterinaria.com"
                  @focus="emailFocus = true"
                  @blur="emailFocus = false"
                  class="input-field"
                />
              </div>
              <span v-if="v$.email.$error" class="error-text">Correo inválido</span>
            </div>

            
            <div class="input-group">
              <label class="label">Contraseña</label>
              <div class="input-wrapper" :class="{ 'error': v$.password.$error, 'focus': passwordFocus }">
                <i class="pi pi-lock icon-left"></i>
                <input 
                  type="password" 
                  v-model="state.password" 
                  placeholder="••••••••"
                  @focus="passwordFocus = true"
                  @blur="passwordFocus = false"
                  class="input-field"
                />
              </div>
              <span v-if="v$.password.$error" class="error-text">Contraseña requerida</span>
            </div>

            
            <div class="forgot-password">
              <a href="#" class="link">¿Olvidaste tu contraseña?</a>
            </div>

            
            <div v-if="iamStore.error" class="error-alert">
              {{ iamStore.error }}
            </div>

            
            <button type="submit" class="button-primary" :disabled="iamStore.isLoading">
              <span v-if="iamStore.isLoading"><i class="pi pi-spin pi-spinner"></i></span>
              <span v-else>Iniciar Sesión</span>
            </button>

            
            <div class="demo-credentials">
              <p><strong>Cuentas de prueba:</strong></p>
              <p>Admin: admin@veterinaria.com / admin123</p>
              <p>Veterinario: doctor@veterinaria.com / vet123</p>
            </div>
          </form>

          <div class="divider">
            <span class="caption">¿No tienes una cuenta? <a href="#" class="caption-link">Registrarse</a></span>
          </div>
        </div>
      </div>
    </div>

    
    <div class="right-panel">
      <div class="panel-content">
        <h2 class="panel-heading">Cuidado Profesional para Mascotas</h2>
        <p class="body-panel">Sistema integral de gestión veterinaria que te ayuda a brindar el mejor cuidado a tus pacientes peludos.</p>
        
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-calendar"></i></div>
            <span class="feature-label">Gestión de citas y recordatorios</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-file"></i></div>
            <span class="feature-label">Historial clínico digital completo</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-bell"></i></div>
            <span class="feature-label">Alertas de vacunación y tratamientos</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { useIamStore } from '../../application/iam.store';

const router = useRouter();
const iamStore = useIamStore();

const state = reactive({
  email: '',
  password: ''
});

const rules = {
  email: { required, email },
  password: { required }
};

const v$ = useVuelidate(rules, state);

const emailFocus = ref(false);
const passwordFocus = ref(false);

const handleLogin = async () => {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;

  const success = await iamStore.login({
    email: state.email,
    password: state.password
  });

  if (success) {
    router.push('/dashboard');
  }
};
</script>

<style scoped>

.login-screen {
  display: flex;
  width: 100%;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.5px;
}


.left-panel {
  flex: 0 0 650px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 80px;
}

.content-wrapper {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.logo-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background: linear-gradient(90deg, #2563eb 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
}

.app-title {
  font-size: 30px;
  line-height: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.app-subtitle {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #64748b;
  margin: 0;
}


.form-card {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  box-shadow: 0px 4px 24px rgba(0,0,0,0.08), 0px 1px 4px rgba(0,0,0,0.04);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.heading-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-heading {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.body-regular {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #64748b;
  margin: 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #374151;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 16px;
  transition: border-color 100ms ease, box-shadow 100ms ease;
}

.input-wrapper.focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
}

.input-wrapper.error {
  border-color: #ef4444;
  background-color: #fff5f5;
}

.icon-left {
  color: #64748b;
  font-size: 16px;
  margin-right: 12px;
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #374151;
  width: 100%;
}

.input-field::placeholder {
  color: #64748b;
}

.error-text {
  font-size: 12px;
  color: #ef4444;
}

.forgot-password {
  display: flex;
  justify-content: flex-end;
}

.link {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: #2563eb;
  text-decoration: none;
  transition: color 100ms ease;
}

.link:hover {
  color: #1d4ed8;
}

.error-alert {
  background-color: #fff5f5;
  color: #ef4444;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #ef4444;
}

.button-primary {
  height: 48px;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0px 2px 8px rgba(37,99,235,0.25);
  transition: background 150ms ease, box-shadow 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.button-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.button-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.caption {
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  color: #64748b;
}

.caption-link {
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}

.demo-credentials {
  margin-top: 16px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 12px;
  color: #0369a1;
}
.demo-credentials p {
  margin: 4px 0;
}


.right-panel {
  flex: 1;
  background: linear-gradient(135deg, #2563eb 0%, #059669 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.panel-content {
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.panel-heading {
  font-size: 30px;
  line-height: 36px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.body-panel {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #ffffff;
  margin-bottom: 40px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  align-items: flex-start;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
}

.feature-label {
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
  color: #ffffff;
}


@media (max-width: 1024px) {
  .right-panel {
    display: none;
  }
  .left-panel {
    flex: 1;
  }
}
</style>
