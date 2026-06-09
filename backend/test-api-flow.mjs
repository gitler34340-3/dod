const API = 'http://localhost:3001';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login ${email}: ${JSON.stringify(data)}`);
  return data;
}

async function authed(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log('=== API integration test ===');

  const admin = await login('admin@hr.local', 'Admin123!');
  console.log('Admin login OK', admin.user.role);

  const shiftsAdmin = await authed('/shifts', admin.accessToken);
  console.log('GET /shifts (admin):', shiftsAdmin.status, Array.isArray(shiftsAdmin.body) ? `${shiftsAdmin.body.length} shifts` : shiftsAdmin.body);

  const employees = await authed('/employees', admin.accessToken);
  console.log('GET /employees:', employees.status, Array.isArray(employees.body) ? `${employees.body.length} employees` : employees.body);

  // Try employee login
  const employeeEmails = ['gay@gay.real', 'dd@beluga.ru', 'daun@daun.ru'];
  let employeeSession = null;
  for (const email of employeeEmails) {
    try {
      employeeSession = await login(email, 'Test1234!');
      console.log(`Employee login OK: ${email}`);
      break;
    } catch {
      try {
        employeeSession = await login(email, 'Admin123!');
        console.log(`Employee login OK with Admin123!: ${email}`);
        break;
      } catch {
        // continue
      }
    }
  }

  if (!employeeSession) {
    console.log('No employee login - skipping employee shift tests');
    return;
  }

  console.log('Employee user:', employeeSession.user);

  const shiftsEmp = await authed('/shifts', employeeSession.accessToken);
  console.log('GET /shifts (employee):', shiftsEmp.status, Array.isArray(shiftsEmp.body) ? `${shiftsEmp.body.length} shifts` : shiftsEmp.body);

  const ownConfirmed = Array.isArray(shiftsEmp.body)
    ? shiftsEmp.body.find((s) => s.employeeId === employeeSession.user.employeeId && s.status === 'Confirmed')
    : null;

  if (ownConfirmed) {
    const other = Array.isArray(employees.body)
      ? employees.body.find((e) => e.id !== employeeSession.user.employeeId)
      : null;
    if (other) {
      const ex = await authed(`/shifts/${ownConfirmed.id}/exchange-request`, employeeSession.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ targetEmployeeId: other.id }),
      });
      console.log('PATCH exchange-request:', ex.status, ex.body);
    }
  } else {
    console.log('No confirmed own shift for exchange test');
  }

  const pendingAssigned = Array.isArray(shiftsEmp.body)
    ? shiftsEmp.body.find(
        (s) =>
          s.employeeId === employeeSession.user.employeeId &&
          s.status === 'Pending' &&
          s.type !== 'Requested',
      )
    : null;

  if (pendingAssigned) {
    const accept = await authed(`/shifts/${pendingAssigned.id}/status`, employeeSession.accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Confirmed' }),
    });
    console.log('PATCH accept assigned:', accept.status, accept.body);
  } else {
    console.log('No pending assigned shift to accept');
  }

  const openShift = Array.isArray(shiftsEmp.body)
    ? shiftsEmp.body.find((s) => !s.employeeId && s.type !== 'Requested')
    : null;

  if (openShift) {
    const acceptOpen = await authed(`/shifts/${openShift.id}/accept`, employeeSession.accessToken, {
      method: 'PATCH',
    });
    console.log('PATCH accept open:', acceptOpen.status, acceptOpen.body);
  }

  // Assign shift as admin
  if (Array.isArray(employees.body) && employees.body[0]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const start = new Date(`${dateStr}T10:00:00`);
    const end = new Date(`${dateStr}T18:00:00`);
    const assign = await authed('/shifts', admin.accessToken, {
      method: 'POST',
      body: JSON.stringify({
        employeeId: employees.body[0].id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        role: 'Cashier',
        type: 'Optional',
        canDecline: true,
      }),
    });
    console.log('POST assign shift:', assign.status, assign.body?.id || assign.body);
  }

  // Job applications review
  const apps = await authed('/job-applications', admin.accessToken);
  console.log('GET job-applications:', apps.status, Array.isArray(apps.body) ? apps.body.length : apps.body);

  // Refresh token
  const refresh = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: admin.refreshToken }),
  });
  console.log('POST refresh:', refresh.status, refresh.ok ? 'OK' : await refresh.text());
}

main().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
