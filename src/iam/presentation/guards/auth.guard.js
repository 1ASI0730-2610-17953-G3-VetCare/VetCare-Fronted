import { useIamStore } from '../../application/iam.store';

function getDefaultRoute(roles) {
  if (roles.includes('admin')) return '/admin/dashboard';
  if (roles.includes('veterinario')) return '/dashboard';
  return '/login';
}

function hasRequiredRole(userRoles, requiredRoles) {
  return requiredRoles.some((role) => userRoles.includes(role.toLowerCase()));
}

export function authGuard(to) {
  const iamStore = useIamStore();
  const isAuthenticated = iamStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false;
  const roles = iamStore.roles;

  if (requiresAuth && !isAuthenticated) {
    return { name: 'login' };
  }

  if (to.name === 'login' && isAuthenticated) {
    return { path: getDefaultRoute(roles) };
  }

  if (to.path === '/') {
    return { path: getDefaultRoute(roles) };
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!hasRequiredRole(roles, to.meta.roles)) {
      const fallback = getDefaultRoute(roles);
      if (to.path !== fallback) {
        return { path: fallback };
      }
    }
  }

  return true;
}
