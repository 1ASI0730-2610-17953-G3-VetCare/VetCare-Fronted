<template>
  <div class="comunicacion-view">
    <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-comments" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('communication.chat.pageTitle') }}</h1>
          <p class="view-description">{{ t('communication.chat.pageDescription') }}</p>
        </div>
      </div>
    </div>

    <div class="comunicacion-shell">
      <div class="chat-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-header-top">
              <h2 class="sidebar-title">{{ t('communication.chat.sidebarTitle') }}</h2>
              <span v-if="!isLoadingClients" class="clients-count-chip">
                {{ t('communication.chat.clientsCount', { count: clients.length }) }}
              </span>
            </div>
            <div class="search-box">
              <i class="pi pi-search search-icon" aria-hidden="true"></i>
              <input
                type="text"
                v-model="searchQuery"
                :placeholder="t('communication.chat.searchPlaceholder')"
                class="search-input"
              />
            </div>
          </div>

          <div class="client-list">
            <PageViewLoading
              v-if="isLoadingClients"
              variant="spinner"
              :message="t('communication.chat.loadingClients')"
            />
            <div v-else-if="filteredClients.length === 0" class="empty-sidebar">
              <i class="pi pi-inbox" aria-hidden="true"></i>
              <p>{{ t('communication.chat.noClients') }}</p>
            </div>
            <button
              v-else
              v-for="client in filteredClients"
              :key="client.id"
              type="button"
              class="client-item"
              :class="{ active: selectedClient?.id === client.id }"
              @click="selectClient(client)"
            >
              <div class="client-avatar" :class="getAvatarTone(client.id)">
                {{ getInitials(client) }}
              </div>
              <div class="client-info">
                <span class="client-name">{{ client.displayName }}</span>
                <span class="client-meta">
                  <i class="pi pi-phone" aria-hidden="true"></i>
                  {{ client.phone || t('communication.chat.noPhone') }}
                </span>
              </div>
              <i class="pi pi-chevron-right client-item-chevron" aria-hidden="true"></i>
            </button>
          </div>
        </aside>

        <section v-if="selectedClient" class="chat-area">
          <header class="chat-header">
            <div class="chat-header-info">
              <div class="client-avatar client-avatar--header" :class="getAvatarTone(selectedClient.id)">
                {{ getInitials(selectedClient) }}
              </div>
              <div class="chat-header-copy">
                <h3 class="chat-client-name">{{ selectedClient.displayName }}</h3>
                <p class="chat-client-phone">
                  <span><i class="pi pi-phone" aria-hidden="true"></i> {{ selectedClient.phone }}</span>
                  <span v-if="selectedClient.email" class="chat-client-email">
                    <i class="pi pi-envelope" aria-hidden="true"></i> {{ selectedClient.email }}
                  </span>
                </p>
              </div>
            </div>
            <span class="channel-badge">
              <i class="pi pi-whatsapp" aria-hidden="true"></i>
              {{ t('communication.chat.channelBadge') }}
            </span>
          </header>

          <div class="chat-history" ref="chatHistoryRef">
            <PageViewLoading
              v-if="isLoadingMessages"
              variant="spinner"
              :message="t('communication.chat.loadingMessages')"
            />
            <div v-else-if="messages.length === 0" class="empty-chat">
              <div class="empty-chat-icon-wrap">
                <i class="pi pi-comments" aria-hidden="true"></i>
              </div>
              <h4 class="empty-chat-title">{{ t('communication.chat.emptyChatTitle') }}</h4>
              <p>{{ t('communication.chat.emptyChatHint') }}</p>
            </div>
            <div
              v-else
              v-for="msg in messages"
              :key="msg.id"
              class="message-row"
              :class="msg.veterinarianId ? 'message-row--out' : 'message-row--in'"
            >
              <div class="message-bubble" :class="msg.veterinarianId ? 'message-out' : 'message-in'">
                <div class="message-content">{{ msg.content }}</div>
                <div class="message-time">
                  {{ formatTime(msg.sentAt) }}
                  <i v-if="msg.veterinarianId" class="pi pi-check-circle" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>

          <footer class="chat-input-area">
            <div class="templates-bar">
              <span class="templates-label">{{ t('communication.chat.templatesLabel') }}</span>
              <button
                v-for="tpl in messageTemplates"
                :key="tpl.id"
                type="button"
                class="btn-template"
                @click="useTemplate(tpl.textKey)"
              >
                <i :class="['pi', tpl.icon]" aria-hidden="true"></i>
                {{ t(`communication.chat.templates.${tpl.labelKey}`) }}
              </button>
            </div>

            <form class="input-form" @submit.prevent="sendMessage">
              <input
                type="text"
                v-model="newMessage"
                :placeholder="t('communication.chat.messagePlaceholder')"
                class="message-input"
                :disabled="isSending"
              />
              <button type="submit" class="btn-send" :disabled="!newMessage.trim() || isSending">
                <i :class="isSending ? 'pi pi-spin pi-spinner' : 'pi pi-send'" aria-hidden="true"></i>
              </button>
            </form>
          </footer>
        </section>

        <section v-else class="no-selection">
          <div class="no-selection-content">
            <div class="no-selection-icon-wrap">
              <i class="pi pi-comment" aria-hidden="true"></i>
            </div>
            <h2>{{ t('communication.chat.noSelectionTitle') }}</h2>
            <p>{{ t('communication.chat.noSelectionDescription') }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { ComunicacionApi } from '../../infrastructure/comunicacion-api.js';
import { DirectMessageEntity } from '../../domain/direct-message.entity.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';

const { t } = useI18n();
const api = new ComunicacionApi();

const clients = ref([]);
const isLoadingClients = ref(true);
const searchQuery = ref('');

const selectedClient = ref(null);
const messages = ref([]);
const isLoadingMessages = ref(false);
const isSending = ref(false);
const newMessage = ref('');
const chatHistoryRef = ref(null);

const messageTemplates = [
  { id: 'lab', icon: 'pi-file-medical', labelKey: 'lab', textKey: 'labText' },
  { id: 'vaccine', icon: 'pi-heart', labelKey: 'vaccine', textKey: 'vaccineText' },
  { id: 'followUp', icon: 'pi-user-edit', labelKey: 'followUp', textKey: 'followUpText' },
  { id: 'appointment', icon: 'pi-calendar', labelKey: 'appointment', textKey: 'appointmentText' }
];

function mapClient(raw) {
  const fullName = raw.fullName ?? raw.FullName ?? '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');

  return {
    id: raw.id,
    fullName,
    firstName,
    lastName,
    displayName: fullName || `${firstName} ${lastName}`.trim(),
    phone: raw.phone ?? raw.Phone ?? '',
    email: raw.email ?? raw.Email ?? ''
  };
}

const filteredClients = computed(() => {
  if (!searchQuery.value.trim()) return clients.value;
  const q = searchQuery.value.toLowerCase();
  return clients.value.filter((client) =>
    client.displayName.toLowerCase().includes(q)
    || client.phone.toLowerCase().includes(q)
    || client.email.toLowerCase().includes(q)
  );
});

const getAvatarTone = (id) => {
  const tones = ['tone-primary', 'tone-info', 'tone-success', 'tone-warm'];
  return tones[Number(id) % tones.length];
};

const getInitials = (client) => {
  const first = client.firstName || client.displayName;
  const last = client.lastName;
  if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return (client.displayName?.slice(0, 2) ?? 'C').toUpperCase();
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
  await fetchClients();
});

const fetchClients = async () => {
  isLoadingClients.value = true;
  try {
    const response = await BaseApi.get('/clients');
    clients.value = (response.data ?? []).map(mapClient);
  } catch (error) {
    console.error('Error fetching clients:', error);
  } finally {
    isLoadingClients.value = false;
  }
};

const selectClient = async (client) => {
  selectedClient.value = client;
  messages.value = [];
  newMessage.value = '';
  await loadMessages(client.id);
};

const loadMessages = async (clientId) => {
  isLoadingMessages.value = true;
  try {
    const data = await api.getClientMessages(clientId);
    messages.value = data.map((d) => new DirectMessageEntity(d));
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  } finally {
    isLoadingMessages.value = false;
  }
};

const useTemplate = (textKey) => {
  newMessage.value = t(`communication.chat.templates.${textKey}`);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedClient.value) return;

  isSending.value = true;
  try {
    const sentMsg = await api.sendMessage({
      clientId: selectedClient.value.id,
      channel: 'WhatsApp',
      content: newMessage.value.trim()
    });
    messages.value.push(new DirectMessageEntity(sentMsg));
    newMessage.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    isSending.value = false;
  }
};
</script>

<style scoped>
.comunicacion-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 160px);
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
  margin: 0 0 4px;
}

.view-description {
  font-size: var(--font-subtitle-size);
  line-height: 1.4;
  font-weight: var(--font-subtitle-weight);
  color: var(--color-text-secondary);
  margin: 0;
}

.comunicacion-shell {
  flex: 1;
  min-height: 520px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.chat-layout {
  display: flex;
  height: 100%;
  min-height: 520px;
}

.sidebar {
  width: 320px;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--color-background-main) 28%, var(--color-background-surface));
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 18px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
}

.sidebar-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.sidebar-title {
  margin: 0;
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
}

.clients-count-chip {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
  white-space: nowrap;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.client-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.client-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-standard);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.client-item:hover {
  background: var(--color-background-surface);
  border-color: var(--color-border-light);
}

.client-item.active {
  background: var(--color-background-surface);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 8%, transparent);
}

.client-item-chevron {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.client-item.active .client-item-chevron {
  color: var(--color-primary-main);
}

.client-avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-body-main-size);
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid var(--color-background-surface);
}

.client-avatar--header {
  width: 48px;
  height: 48px;
  margin-right: 14px;
}

.client-avatar.tone-primary {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
}

.client-avatar.tone-info {
  color: var(--color-status-info-text);
  background: var(--color-status-info-bg);
}

.client-avatar.tone-success {
  color: var(--color-status-success-text);
  background: var(--color-status-success-bg);
}

.client-avatar.tone-warm {
  color: var(--color-status-warning-text);
  background: var(--color-status-warning-bg);
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-meta {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: color-mix(in srgb, var(--color-background-main) 45%, var(--color-background-surface));
}

.chat-header {
  padding: 16px 22px;
  background: var(--color-background-surface);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.chat-header-info {
  display: flex;
  align-items: center;
  min-width: 0;
}

.chat-header-copy {
  min-width: 0;
}

.chat-client-name {
  margin: 0 0 4px;
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
}

.chat-client-phone {
  margin: 0;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.chat-client-phone span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chat-client-phone .pi {
  font-size: 12px;
  color: var(--color-text-muted);
}

.channel-badge {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  white-space: nowrap;
}

.chat-history {
  flex: 1;
  padding: 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-primary-main) 4%, transparent) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row--out {
  justify-content: flex-end;
}

.message-row--in {
  justify-content: flex-start;
}

.message-bubble {
  max-width: min(72%, 520px);
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: var(--shadow-card);
}

.message-out {
  background: color-mix(in srgb, var(--color-primary-subtle) 85%, var(--color-background-surface));
  color: var(--color-text-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  border-bottom-right-radius: 4px;
}

.message-in {
  background: var(--color-background-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: var(--font-body-main-size);
  line-height: 1.5;
  margin-bottom: 6px;
}

.message-time {
  font-size: 11px;
  color: var(--color-text-secondary);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.message-time .pi {
  color: var(--color-primary-main);
  font-size: 12px;
}

.chat-input-area {
  padding: 16px 22px 20px;
  background: var(--color-background-surface);
  border-top: 1px solid var(--color-border-light);
}

.templates-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 4px;
}

.templates-label {
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.btn-template {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, var(--color-background-main) 50%, var(--color-background-surface));
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-template .pi {
  font-size: 12px;
  color: var(--color-primary-main);
}

.btn-template:hover {
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, transparent);
  color: var(--color-primary-main);
}

.input-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-background-main) 35%, var(--color-background-surface));
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.message-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
  background: var(--color-background-surface);
}

.message-input:disabled {
  opacity: 0.7;
}

.btn-send {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-full);
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-send:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
  transform: none;
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: color-mix(in srgb, var(--color-primary-subtle) 18%, var(--color-background-surface));
}

.no-selection-content {
  text-align: center;
  max-width: 420px;
}

.no-selection-icon-wrap {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  color: var(--color-primary-main);
  font-size: 28px;
}

.no-selection-content h2 {
  font-size: var(--font-title-size);
  font-weight: var(--font-title-weight);
  color: var(--color-text-primary);
  margin: 0 0 10px;
}

.no-selection-content p {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin: 0;
}

.empty-sidebar {
  padding: 32px 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
}

.empty-sidebar .pi {
  font-size: 28px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
  display: block;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
  text-align: center;
  color: var(--color-text-secondary);
  padding: 24px;
}

.empty-chat-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-surface);
  border: 1px dashed color-mix(in srgb, var(--color-primary-main) 24%, var(--color-border-light));
  color: var(--color-primary-main);
  font-size: 22px;
  margin-bottom: 14px;
}

.empty-chat-title {
  margin: 0 0 6px;
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
}

.empty-chat p {
  margin: 0;
  font-size: var(--font-body-main-size);
  max-width: 320px;
  line-height: 1.45;
}

@media (max-width: 960px) {
  .chat-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 280px;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }

  .no-selection {
    min-height: 280px;
  }
}

@media (max-width: 640px) {
  .comunicacion-view {
    min-height: auto;
  }

  .chat-header {
    padding: 14px 16px;
  }

  .chat-history {
    padding: 16px;
  }

  .chat-input-area {
    padding: 14px 16px 16px;
  }

  .message-bubble {
    max-width: 88%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .client-item,
  .btn-template,
  .btn-send {
    transition: none;
  }

  .btn-send:hover:not(:disabled) {
    transform: none;
  }
}
</style>
