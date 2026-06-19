import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAdminDateLabel() {
  const { locale } = useI18n()

  const adminDateLabel = computed(() => {
    const dateLocale = locale.value === 'en' ? 'en-US' : 'es-PE'
    return new Date().toLocaleDateString(dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  })

  return { adminDateLabel }
}
