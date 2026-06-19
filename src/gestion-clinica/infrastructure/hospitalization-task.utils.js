import { ref } from 'vue';

export const TASK_PRIORITY_ORDER = ['critico', 'urgente', 'en_proceso', 'en_espera'];

export const pendingTasksState = ref([]);

export const getTodayIso = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isTaskToday = (task) => {
  const today = getTodayIso();
  const date = task.date ?? today;
  if (!date) return true;
  if (date > today) return false;
  if (date < today) return !task.completed;
  return true;
};

export const sortTasksByPriority = (tasks) =>
  [...tasks].sort((a, b) => {
    const orderA = TASK_PRIORITY_ORDER.indexOf(a.status);
    const orderB = TASK_PRIORITY_ORDER.indexOf(b.status);
    return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
  });

export const formatTaskTime = (time) => {
  if (!time) return '—';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return time;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes ?? '00'} ${ampm}`;
};

export const getPatientNameFromTask = (task) => {
  const parts = task.title.split(' - ');
  return parts[0]?.trim() || task.title;
};

export const getTaskLabelFromTask = (task) => {
  const parts = task.title.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ').trim() : task.title;
};

export const getCriticalTasksToday = () =>
  sortTasksByPriority(
    pendingTasksState.value.filter(
      (task) => isTaskToday(task) && !task.completed && task.status === 'critico'
    )
  );
