const API = 'http://localhost:3001';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { ok: res.ok, data: await res.json(), status: res.status };
}

async function req(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

const admin = await login('admin@hr.local', 'Admin123!');
console.log('admin login', admin.status);

const token = admin.data.accessToken;
const employees = await req('/employees', token);
const emp = employees.body[0];
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 3);
const ds = tomorrow.toISOString().slice(0, 10);

const assign = await req('/shifts', token, {
  method: 'POST',
  body: JSON.stringify({
    employeeId: emp.id,
    startTime: new Date(`${ds}T09:00:00`).toISOString(),
    endTime: new Date(`${ds}T17:00:00`).toISOString(),
    role: 'Cashier',
    type: 'Optional',
    canDecline: true,
  }),
});
console.log('assign shift', assign.status, assign.body);

const requested = (await req('/shifts', token)).body.find((s) => s.type === 'Requested' && s.status === 'Pending');
if (requested) {
  const approve = await req(`/shifts/${requested.id}/approve`, token, { method: 'PATCH' });
  console.log('approve requested', approve.status, approve.body?.status || approve.body);
}

const apps = await req('/job-applications', token);
const pending = apps.body?.find?.((a) => a.status === 'pending');
if (pending) {
  const review = await req(`/job-applications/${pending.id}/review`, token, {
    method: 'PUT',
    body: JSON.stringify({ status: 'rejected', notes: 'auto test' }),
  });
  console.log('reject app', review.status);
}

console.log('DONE');
