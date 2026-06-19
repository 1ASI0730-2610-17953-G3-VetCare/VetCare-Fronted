let appointments = [];

export const AgendaMemory = {
  getAll() {
    return appointments.map((item) => ({ ...item }));
  },

  create(data) {
    const record = {
      ...data,
      id: data.id || String(Date.now())
    };
    appointments.push(record);
    return { ...record };
  },

  purgePast(todayIso) {
    appointments = appointments.filter((item) => item.date >= todayIso);
  },

  replaceAll(items) {
    appointments = items.map((item) => ({ ...item }));
  }
};
