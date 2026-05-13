import { useIamStore } from '../../application/iam.store';

export function authGuard(to, from, next) {
  const iamStore = useIamStore();
  const isAuthenticated = iamStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !isAuthenticated) {

    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {

    if (iamStore.roles.includes('admin')) {
      next({ path: '/admin/inventory' });
    } else {
      next({ path: '/dashboard' });
    }
  } else if (to.path === '/') {

    if (iamStore.roles.includes('admin')) {
      next({ path: '/admin/inventory' });
    } else {
      next({ path: '/dashboard' });
    }
  } else if (to.meta.roles && to.meta.roles.length > 0) {

    const hasRole = to.meta.roles.some(role => iamStore.roles.includes(role));
    if (!hasRole) {

      if (iamStore.roles.includes('admin')) {
        next({ path: '/admin/inventory' });
      } else {
        next({ path: '/dashboard' });
      }
    } else {
      next();
    }
  } else {

    next();
  }
}
