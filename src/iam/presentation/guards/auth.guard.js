import { useIamStore } from '../../application/iam.store';

export function authGuard(to, from, next) {
  const iamStore = useIamStore();
  const isAuthenticated = iamStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false; // por defecto todo requiere auth, a menos que se especifique lo contrario

  if (requiresAuth && !isAuthenticated) {
    // Si necesita auth y no está logueado, redirigir a login
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // Si está logueado y quiere ir al login, redirigir según rol
    if (iamStore.roles.includes('admin')) {
      next({ path: '/admin/inventory' });
    } else {
      next({ path: '/dashboard' });
    }
  } else if (to.path === '/') {
    // Redirección dinámica desde la raíz según rol
    if (iamStore.roles.includes('admin')) {
      next({ path: '/admin/inventory' });
    } else {
      next({ path: '/dashboard' });
    }
  } else if (to.meta.roles && to.meta.roles.length > 0) {
    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = to.meta.roles.some(role => iamStore.roles.includes(role));
    if (!hasRole) {
      // Si no tiene permiso, redirigir a su ruta por defecto
      if (iamStore.roles.includes('admin')) {
        next({ path: '/admin/inventory' });
      } else {
        next({ path: '/dashboard' });
      }
    } else {
      next();
    }
  } else {
    // Permitir navegación
    next();
  }
}
