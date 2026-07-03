const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CREDENTIALS = { email: process.env.TEST_EMAIL || 'john@pasalho.com', password: process.env.TEST_PASSWORD || 'pass123' };

async function main(){
  console.log('Auth tests starting against', BASE);

  // Login
  let res = await fetch(`${BASE}/api/reps/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(CREDENTIALS) });
  const login = await res.json();
  if(!res.ok) { console.error('LOGIN failed', login); process.exit(1); }
  console.log('LOGIN ok');

  const { accessToken, refreshToken } = login;
  if(!accessToken || !refreshToken){ console.error('Missing tokens'); process.exit(1); }

  // Me
  res = await fetch(`${BASE}/api/reps/me`, { headers: { Authorization: 'Bearer ' + accessToken } });
  const me = await res.json();
  if(!res.ok) { console.error('ME failed', me); process.exit(1); }
  console.log('ME ok:', me.rep?.email);

  // History
  res = await fetch(`${BASE}/api/orders/history`, { headers: { Authorization: 'Bearer ' + accessToken } });
  const history = await res.json();
  if(!res.ok) { console.error('HISTORY failed', history); process.exit(1); }
  console.log('HISTORY ok, orders:', (history.orders||[]).length);

  // Refresh
  res = await fetch(`${BASE}/api/reps/refresh`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken }) });
  const refreshed = await res.json();
  if(!res.ok) { console.error('REFRESH failed', refreshed); process.exit(1); }
  console.log('REFRESH ok');

  // Logout revoke
  res = await fetch(`${BASE}/api/reps/logout`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken }) });
  const logout = await res.json();
  if(!res.ok) { console.error('LOGOUT failed', logout); process.exit(1); }
  console.log('LOGOUT ok');

  // Refresh again should fail
  res = await fetch(`${BASE}/api/reps/refresh`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken }) });
  if(res.ok){ const body = await res.json(); console.error('REFRESH should have failed but returned', body); process.exit(1); }
  console.log('REFRESH after logout correctly failed');

  console.log('All auth tests passed');
}

main().catch(e=>{console.error(e); process.exit(1);});
