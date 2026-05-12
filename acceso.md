localStorage.setItem('vetcare_access_token', 'dev-token');
localStorage.setItem('vetcare_user', JSON.stringify({
  nombre: 'Dr. Arturo',
  apellidos: 'Veterinario',
  roles: ['admin']
}));
location.href = '/dashboard';
Correo: doctor@veterinaria.com
Contraseña: admin123