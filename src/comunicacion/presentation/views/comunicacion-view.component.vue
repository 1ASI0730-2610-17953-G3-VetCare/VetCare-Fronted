<template>
  <div class="comu-container">
    <div class="comu-layout">
      <!-- Main Content Area: Notificaciones Feed -->
      <div class="notification-feed">
        <div class="feed-header">
          <div style="display: flex; align-items: center;">
            <div class="header-icon-main icon-blue">
              <i class="pi pi-bell"></i>
            </div>
            <div class="header-text-group">
              <h2 class="feed-title">Notificaciones</h2>
              <p class="feed-subtitle">Actividad reciente de la clínica</p>
            </div>
          </div>
          <a href="#" class="feed-action" @click.prevent="markAllAsRead">Marcar todas como leídas</a>
        </div>
        <div class="feed-list">
          <div 
            v-for="notif in notificaciones" 
            :key="notif.id" 
            class="notification-item" 
            :class="getRowClass(notif.status)"
          >
            <!-- Timeline Badge Icon -->
            <div class="timeline-badge" :class="`badge-${notif.type}`">
              <i :class="getIconForType(notif.type)"></i>
            </div>
            
            <!-- Center Content -->
            <div class="notification-content">
              <h3 class="notif-title">{{ notif.title }}</h3>
              <p class="notif-desc">{{ notif.description }}</p>
              <div class="notif-meta">
                <i class="pi pi-tag meta-icon"></i>
                <span style="margin-right: 12px;">{{ notif.metadata }}</span>
                <span v-if="notif.status" class="status-tag" :class="getStatusClass(notif.status)">{{ notif.status }}</span>
              </div>
            </div>

            <!-- Right Area -->
            <div class="notification-right">
              <span class="notif-time">{{ notif.timestamp }}</span>
              <button v-if="!notif.is_read" class="btn-read" @click="markAsRead(notif.id)" title="Marcar como leída">
                <i class="pi pi-check"></i>
              </button>
            </div>
          </div>
          
          <div v-if="notificaciones.length === 0" class="empty-state">
             <p>No hay notificaciones.</p>
          </div>
        </div>
      </div>

      <!-- Sidebar Area: Recordatorios -->
      <div class="comu-sidebar outer-card">
        <div class="sidebar-header">
          <div style="display: flex; align-items: center;">
            <div class="header-icon-main icon-purple">
              <i class="pi pi-list"></i>
            </div>
            <div class="header-text-group">
              <h2 class="sidebar-title">Recordatorios</h2>
              <p class="sidebar-subtitle">Eventos próximos</p>
            </div>
          </div>
          <a href="#" class="feed-action" style="font-size: 18px; color: #64748B;" title="Editar recordatorios">
            <i class="pi pi-pencil"></i>
          </a>
        </div>
        
        <div 
          v-for="rec in recordatorios" 
          :key="rec.id" 
          class="reminder-card"
        >
          <div class="reminder-header">
            <div class="reminder-icon-box" :class="`badge-${rec.type}`">
              <i :class="getIconForType(rec.type)"></i>
            </div>
            <div style="flex: 1;">
              <h3 class="reminder-title">{{ rec.title }}</h3>
            </div>
          </div>
          <div class="reminder-content">
            <p class="reminder-desc">{{ rec.description }}</p>
            <div class="reminder-meta" v-if="rec.metadata || rec.status">
              <i v-if="rec.metadata" class="pi pi-calendar meta-icon"></i>
              <span v-if="rec.metadata" style="margin-right: 12px;">{{ rec.metadata }}</span>
              <span v-if="rec.status" class="status-tag" :class="getStatusClass(rec.status)">{{ rec.status }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="recordatorios.length === 0" class="empty-state">
           <p>No hay recordatorios activos.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ComunicacionApi } from '../../infrastructure/comunicacion-api.js';
import { NotificacionEntity } from '../../domain/notificacion.entity.js';
import { RecordatorioEntity } from '../../domain/recordatorio.entity.js';

const api = new ComunicacionApi();
const notificaciones = ref([]);
const recordatorios = ref([]);

const getIconForType = (type) => {
  const map = {
    health: 'pi pi-heart',
    lab: 'pi pi-chart-pie',
    appointment: 'pi pi-calendar',
    surgery: 'pi pi-star',
    inventory: 'pi pi-box',
    info: 'pi pi-info-circle'
  };
  return map[type] || 'pi pi-info-circle';
};

const getStatusClass = (status) => {
  const lower = status.toLowerCase();
  if(lower.includes('no leída') || lower.includes('curso')) return 'tag-blue';
  if(lower.includes('pendiente')) return 'tag-amber';
  if(lower.includes('próxima') || lower.includes('completada')) return 'tag-emerald';
  if(lower.includes('urgente')) return 'tag-red';
  return 'tag-blue';
};

const getRowClass = (status) => {
  const lower = status.toLowerCase();
  if(lower.includes('no leída')) return 'row-unread';
  if(lower.includes('pendiente')) return 'row-pending';
  if(lower.includes('urgente')) return 'row-urgent';
  if(lower.includes('completada')) return 'row-completed';
  return '';
};

const loadData = async () => {
  try {
    const rawNotifs = await api.getNotificaciones();
    notificaciones.value = rawNotifs.map(n => new NotificacionEntity(n));
    
    const rawRecs = await api.getRecordatorios();
    recordatorios.value = rawRecs.map(r => new RecordatorioEntity(r));
  } catch(e) {
    console.error('Error loading communication data', e);
  }
};

const markAsRead = async (id) => {
  try {
    await api.markAsRead(id);
    const notif = notificaciones.value.find(n => n.id === id);
    if(notif) {
      notif.is_read = true;
      if (notif.status.toLowerCase() === 'no leída') {
        notif.status = 'Leída';
      }
    }
  } catch(e) {
    console.error('Error marking as read', e);
  }
};

const markAllAsRead = async () => {
  try {
    const unread = notificaciones.value.filter(n => !n.is_read);
    for(const u of unread) {
      await api.markAsRead(u.id);
      u.is_read = true;
      if (u.status.toLowerCase() === 'no leída') {
        u.status = 'Leída';
      }
    }
  } catch(e) {
    console.error('Error marking all as read', e);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.comu-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.comu-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .comu-layout {
    grid-template-columns: 1fr;
  }
}

.notification-feed {
  background-color: var(--color-bg-surface, #FFFFFF);
  border: 1px solid var(--color-border-light, #E2E8F0);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.feed-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-border-light, #E2E8F0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feed-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.feed-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748B;
}

.feed-action {
  color: #2563EB;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
}

.feed-action:hover {
  text-decoration: underline;
}

.notification-item {
  display: flex;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light, #E2E8F0);
  background-color: #FFFFFF;
  transition: background-color 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.row-unread { background-color: #EFF6FF; }
.row-pending { background-color: #FFFBEB; }
.row-urgent { background-color: #FEF2F2; }
.row-completed { background-color: #F0FDF4; }

.timeline-badge {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  margin-right: 16px;
}

.badge-health { background-color: rgba(239, 68, 68, 0.1); color: #EF4444; }
.badge-lab { background-color: rgba(168, 85, 247, 0.1); color: #A855F7; }
.badge-appointment { background-color: rgba(14, 165, 233, 0.1); color: #0369A1; }
.badge-surgery { background-color: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.badge-inventory { background-color: rgba(100, 116, 139, 0.1); color: #64748B; }
.badge-info { background-color: #E0F2FE; color: #0369A1; }

.notification-content {
  flex: 1;
}

.notif-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
}

.notif-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #4B5563;
  line-height: 1.5;
}

.notif-meta {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #64748B;
}

.meta-icon {
  margin-right: 6px;
  font-size: 14px;
}

.notification-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 80px;
  margin-left: 16px;
  position: relative;
}

.notif-time {
  font-size: 12px;
  color: #64748B;
  margin-bottom: 8px;
}

.status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
}

.tag-blue { background-color: #DBEAFE; color: #1D4ED8; }
.tag-amber { background-color: #FEF3C7; color: #B45309; }
.tag-emerald { background-color: #D1FAE5; color: #047857; }
.tag-red { background-color: #FEE2E2; color: #B91C1C; }

.btn-read {
  margin-top: auto;
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.btn-read:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.comu-sidebar {
  display: flex;
  flex-direction: column;
}

.outer-card {
  background-color: var(--color-bg-surface, #FFFFFF);
  border: 1px solid var(--color-border-light, #E2E8F0);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-icon-main {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}
.icon-blue { background-color: #E0F2FE; color: #0369A1; }
.icon-purple { background-color: #F3E8FF; color: #7E22CE; }

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.sidebar-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.sidebar-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748B;
}

.reminder-card {
  background-color: var(--color-bg-surface, #FFFFFF);
  border: 1px solid var(--color-border-light, #E2E8F0);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.reminder-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.reminder-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 12px;
}

.reminder-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}

.reminder-content {
  padding-left: 48px;
}

.reminder-desc {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4B5563;
  line-height: 1.4;
}

.reminder-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #64748B;
  font-size: 14px;
}
</style>
