import { ref } from 'vue';

export const vaccinesState = ref([]);

export const parseDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return null;
  const monthMap = {
    Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
    Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11
  };
  const [day, monthLabel, year] = dateStr.split(' ');
  const month = monthMap[monthLabel];
  if (month === undefined) return null;
  return new Date(Number(year), month, Number(day));
};

export const computeVaccineStatus = (nextDoseStr) => {
  const nextDate = parseDisplayDate(nextDoseStr);
  if (!nextDate) return { status: 'Al Día', type: 'success' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const daysDiff = (nextDate - today) / (1000 * 60 * 60 * 24);
  if (daysDiff < 0) return { status: 'Vencida', type: 'danger' };
  if (daysDiff <= 30) return { status: 'Próxima', type: 'warning' };
  return { status: 'Al Día', type: 'success' };
};

export const getEnrichedVaccines = () =>
  vaccinesState.value.map((vaccine) => ({
    ...vaccine,
    ...computeVaccineStatus(vaccine.nextDose)
  }));

export const getExpiredVaccines = () =>
  getEnrichedVaccines()
    .filter((vaccine) => vaccine.status === 'Vencida')
    .sort((a, b) => {
      const dateA = parseDisplayDate(a.nextDose);
      const dateB = parseDisplayDate(b.nextDose);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
