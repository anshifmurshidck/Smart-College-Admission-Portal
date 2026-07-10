// Wrapper around fetch for protected admin endpoints.
// On a 401 (missing/expired/invalid JWT) it clears the stale session and
// redirects to the admin login, so the UI self-heals instead of looping on 401s.
export async function adminFetch(input, init) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}
