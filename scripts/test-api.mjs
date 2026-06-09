const API = 'http://localhost:3001';

async function login(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return d.accessToken || d.token;
}

async function test(name, fn) {
  try {
    await fn();
    console.log('OK', name);
  } catch (e) {
    console.log('FAIL', name, e.message);
  }
}

const token = await login('admin@hr.local', 'Admin123!');

await test('GET shifts', async () => {
  const r = await fetch(`${API}/shifts`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(String(r.status));
});

await test('GET employees', async () => {
  const r = await fetch(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(String(r.status));
});

await test('GET job-applications', async () => {
  const r = await fetch(`${API}/job-applications`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(String(r.status));
});

const future = new Date(Date.now() + 86400000 * 7).toISOString();
const end = new Date(Date.now() + 86400000 * 7 + 8 * 3600000).toISOString();

await test('POST assign shift', async () => {
  const emps = await (await fetch(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const r = await fetch(`${API}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      employeeId: emps[0].id,
      startTime: future,
      endTime: end,
      role: 'Cashier',
      type: 'Optional',
      canDecline: true,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
});

await test('PATCH approve pending shift', async () => {
  const shifts = await (await fetch(`${API}/shifts`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const s = shifts.find((x) => x.status === 'Pending');
  if (!s) throw new Error('no pending shift');
  const r = await fetch(`${API}/shifts/${s.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(await r.text());
});
