<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
import { useIamStore } from '../../application/iam.store.js'

const router = useRouter()
const iamStore = useIamStore()

const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: { required, email },
  password: { required }
}

const v$ = useVuelidate(rules, form)
const emailFocused = ref(false)
const passwordFocused = ref(false)

const handleLogin = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  const success = await iamStore.login({
    email: form.email,
    password: form.password
  })

  if (success) {
    const redirectPath = iamStore.roles.includes('admin') ? '/admin/dashboard' : '/dashboard'
    router.push(redirectPath)
  }
}
</script>

<template>
  <div class="login-screen">
    <div class="left-panel">
      <div class="left-panel-backdrop" aria-hidden="true">
        <span class="ambient-orb ambient-orb--primary"></span>
        <span class="ambient-orb ambient-orb--success"></span>
      </div>

      <div class="content-wrapper">
        <div class="logo-block">
          <div class="logo-icon">
            <img
              src="/vetcare-logo-mark.svg"
              alt=""
              class="logo-img"
              width="48"
              height="48"
            />
          </div>
          <div class="logo-text">
            <h1 class="app-title">VetCare Pro</h1>
            <p class="app-subtitle">Sistema de Gestión Veterinaria</p>
          </div>
        </div>

        <div class="form-card">
          <div class="form-card-accent" aria-hidden="true"></div>

          <div class="heading-block">
            <span class="form-eyebrow">Acceso profesional</span>
            <h2 class="section-heading">Iniciar Sesión</h2>
            <p class="body-regular">Accede a tu cuenta profesional</p>
          </div>

          <form @submit.prevent="handleLogin" class="form-fields">
            <div class="input-group">
              <label class="label" for="login-email">Correo Electrónico</label>
              <div
                class="input-wrapper"
                :class="{ error: v$.email.$error, focus: emailFocused }"
              >
                <i class="pi pi-envelope icon-left"></i>
                <input
                  id="login-email"
                  v-model="form.email"
                  type="email"
                  placeholder="doctor@veterinaria.com"
                  class="input-field"
                  autocomplete="email"
                  @focus="emailFocused = true"
                  @blur="emailFocused = false"
                />
              </div>
              <span v-if="v$.email.$error" class="error-text">Correo inválido</span>
            </div>

            <div class="input-group">
              <label class="label" for="login-password">Contraseña</label>
              <div
                class="input-wrapper"
                :class="{ error: v$.password.$error, focus: passwordFocused }"
              >
                <i class="pi pi-lock icon-left"></i>
                <input
                  id="login-password"
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  class="input-field"
                  autocomplete="current-password"
                  @focus="passwordFocused = true"
                  @blur="passwordFocused = false"
                />
              </div>
              <span v-if="v$.password.$error" class="error-text">Contraseña requerida</span>
            </div>

            <div class="forgot-password">
              <a href="#" class="link">¿Olvidaste tu contraseña?</a>
            </div>

            <div v-if="iamStore.error" class="error-alert" role="alert">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ iamStore.error }}</span>
            </div>

            <button type="submit" class="button-primary" :disabled="iamStore.isLoading">
              <span v-if="iamStore.isLoading">
                <i class="pi pi-spin pi-spinner"></i>
              </span>
              <span v-else>Iniciar Sesión</span>
            </button>

            <div class="demo-credentials">
              <div class="demo-credentials-head">
                <i class="pi pi-users"></i>
                <strong>Cuentas de prueba</strong>
              </div>
              <div class="demo-credentials-list">
                <div class="demo-row">
                  <span class="demo-role">Admin</span>
                  <span class="demo-detail">carlos@vetcare.com · Password123!</span>
                </div>
                <div class="demo-row">
                  <span class="demo-role">Veterinario</span>
                  <span class="demo-detail">ana@vetcare.com · Password123!</span>
                </div>
              </div>
            </div>
          </form>

          <div class="divider">
            <span class="caption">
              ¿No tienes una cuenta?
              <a href="#" class="caption-link">Registrarse</a>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <div class="right-panel-backdrop" aria-hidden="true">
        <span class="panel-ring panel-ring--one"></span>
        <span class="panel-ring panel-ring--two"></span>
      </div>

      <div class="panel-content">
        <div class="panel-badge">
          <i class="pi pi-heart-fill"></i>
          <span>Cuidado clínico integral</span>
        </div>
        <h2 class="panel-heading">Cuidado Profesional para Mascotas</h2>
        <p class="body-panel">
          Sistema integral de gestión veterinaria que te ayuda a brindar el mejor cuidado a tus pacientes peludos.
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <span class="feature-label">Gestión de citas y recordatorios</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-file"></i>
            </div>
            <span class="feature-label">Historial clínico digital completo</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-bell"></i>
            </div>
            <span class="feature-label">Alertas de vacunación y tratamientos</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  display: flex;
  width: 100%;
  min-height: 100vh;
  letter-spacing: -0.5px;
  background-color: var(--color-background-sidebar);
}

.left-panel {
  position: relative;
  flex: 0 0 650px;
  background-color: var(--color-background-sidebar);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 80px;
  overflow: hidden;
  isolation: isolate;
}

.left-panel-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(color-mix(in srgb, var(--color-primary-main) 7%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 72%);
}

.ambient-orb {
  position: absolute;
  border-radius: var(--radius-full);
  filter: blur(60px);
  opacity: 0.55;
}

.ambient-orb--primary {
  width: 280px;
  height: 280px;
  top: -80px;
  left: -60px;
  background: color-mix(in srgb, var(--color-primary-subtle) 85%, var(--color-primary-main));
}

.ambient-orb--success {
  width: 220px;
  height: 220px;
  bottom: 8%;
  right: -40px;
  background: color-mix(in srgb, var(--color-status-success-bg) 90%, var(--color-status-success-indicator));
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  animation: login-enter 0.55s ease both;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
  padding-left: 4px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow:
    0 8px 24px color-mix(in srgb, var(--color-primary-main) 28%, transparent),
    0 0 0 4px color-mix(in srgb, var(--color-primary-subtle) 70%, transparent);
}

.logo-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 30px;
  line-height: 36px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.app-subtitle {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin: 0;
}

.form-card {
  position: relative;
  width: 100%;
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow:
    var(--shadow-card),
    0 20px 48px color-mix(in srgb, var(--color-text-primary) 6%, transparent);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
}

.form-card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary-main) 0%, var(--color-status-success-indicator) 100%);
}

.heading-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-eyebrow {
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary-main);
  margin-bottom: 2px;
}

.section-heading {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.body-regular {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: var(--color-text-secondary);
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
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  background-color: var(--color-background-sidebar);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 0 16px;
  transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}

.input-wrapper.focus {
  border-color: var(--color-primary-main);
  background-color: var(--color-background-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 15%, transparent);
}

.input-wrapper.focus .icon-left {
  color: var(--color-primary-main);
}

.input-wrapper.error {
  border-color: var(--color-status-danger-indicator);
  background-color: var(--color-status-danger-bg);
}

.icon-left {
  color: var(--color-text-secondary);
  font-size: 16px;
  margin-right: 12px;
  transition: color 150ms ease;
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--color-text-primary);
  width: 100%;
}

.input-field::placeholder {
  color: var(--color-text-secondary);
}

.error-text {
  font-size: 12px;
  color: var(--color-status-danger-indicator);
}

.forgot-password {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.link {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--color-primary-main);
  text-decoration: none;
  transition: color 100ms ease;
}

.link:hover {
  color: var(--color-primary-hover);
}

.link:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
  border-radius: 4px;
}

.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 28%, transparent);
}

.error-alert i {
  font-size: 16px;
  margin-top: 1px;
  flex-shrink: 0;
}

.button-primary {
  height: 48px;
  background: linear-gradient(180deg, var(--color-primary-main) 0%, var(--color-primary-hover) 100%);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0px 4px 14px color-mix(in srgb, var(--color-primary-main) 30%, transparent);
  transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.button-primary:hover:not(:disabled) {
  filter: brightness(1.03);
  box-shadow: 0px 6px 18px color-mix(in srgb, var(--color-primary-main) 34%, transparent);
  transform: translateY(-1px);
}

.button-primary:active:not(:disabled) {
  transform: translateY(0);
}

.button-primary:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.button-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.demo-credentials {
  padding: 14px 16px;
  background: linear-gradient(
    135deg,
    var(--color-status-info-bg) 0%,
    color-mix(in srgb, var(--color-primary-subtle) 65%, var(--color-status-info-bg)) 100%
  );
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, var(--color-border-light));
  border-radius: 10px;
}

.demo-credentials-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-status-info-text);
  margin-bottom: 10px;
}

.demo-credentials-head i {
  font-size: 14px;
  color: var(--color-primary-main);
}

.demo-credentials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--color-background-surface) 72%, transparent);
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 10%, transparent);
}

.demo-role {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary-main);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-detail {
  font-size: 12px;
  line-height: 18px;
  font-weight: 400;
  color: var(--color-status-info-text);
  word-break: break-all;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.caption {
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.caption-link {
  font-weight: 600;
  color: var(--color-primary-main);
  text-decoration: none;
}

.caption-link:hover {
  color: var(--color-primary-hover);
}

.right-panel {
  position: relative;
  flex: 1;
  background: linear-gradient(145deg, var(--color-primary-main) 0%, var(--color-status-success-indicator) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  overflow: hidden;
  isolation: isolate;
}

.right-panel-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel-ring {
  position: absolute;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-primary-contrastText) 22%, transparent);
}

.panel-ring--one {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -80px;
  background: color-mix(in srgb, var(--color-primary-contrastText) 6%, transparent);
}

.panel-ring--two {
  width: 280px;
  height: 280px;
  bottom: -60px;
  left: -40px;
  background: color-mix(in srgb, var(--color-primary-contrastText) 4%, transparent);
}

.panel-content {
  position: relative;
  z-index: 1;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: login-enter 0.65s ease 0.08s both;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin-bottom: 20px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary-contrastText) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-contrastText) 24%, transparent);
  backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-contrastText);
}

.panel-badge i {
  font-size: 12px;
}

.panel-heading {
  font-size: 30px;
  line-height: 36px;
  font-weight: 700;
  color: var(--color-primary-contrastText);
  margin-bottom: 16px;
}

.body-panel {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: var(--color-primary-contrastText);
  margin-bottom: 36px;
  opacity: 0.94;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  align-items: stretch;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primary-contrastText) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-contrastText) 18%, transparent);
  backdrop-filter: blur(10px);
  transition: background 180ms ease, transform 180ms ease;
}

.feature-item:hover {
  background: color-mix(in srgb, var(--color-primary-contrastText) 16%, transparent);
  transform: translateX(4px);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-primary-contrastText) 18%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-contrastText);
  font-size: 20px;
  flex-shrink: 0;
}

.feature-label {
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
  color: var(--color-primary-contrastText);
  text-align: left;
}

@keyframes login-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .content-wrapper,
  .panel-content {
    animation: none;
  }

  .feature-item:hover {
    transform: none;
  }

  .button-primary:hover:not(:disabled) {
    transform: none;
  }
}

@media (max-width: 1024px) {
  .right-panel {
    display: none;
  }

  .left-panel {
    flex: 1;
    padding: 40px 24px;
  }
}
</style>
