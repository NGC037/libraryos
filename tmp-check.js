const cookies = new Map();

async function request(url, init = {}) {
  const headers = new Headers(init.headers || {});
  if (cookies.size) {
    headers.set('Cookie', [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '));
  }
  const res = await fetch(url, { ...init, headers, redirect: 'manual' });
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const raw of setCookies) {
    const pair = raw.split(';')[0];
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    cookies.set(name, value);
  }
  return res;
}

async function loginAs(email) {
  const csrfRes = await request('http://localhost:3000/api/auth/csrf');
  const csrf = await csrfRes.json();
  const loginBody = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    callbackUrl: 'http://localhost:3000',
    json: 'true',
  }).toString();

  const loginRes = await request('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: loginBody,
    redirect: 'manual',
  });

  if (loginRes.status !== 302 && loginRes.status !== 200) {
    throw new Error(`Login failed for ${email}: ${loginRes.status}`);
  }

  return loginRes;
}

(async () => {
  const personId = '072d5155-d1c4-46a9-95a3-61b8af26d912';
  const adminEmail = 'neha@example.com';
  const memberEmail = 'testpatron@example.com';

  // Ensure the member account exists for the person created in onboarding.
  const createAccount = await fetch('http://localhost:3000/api/trpc/credentials.issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, type: 'qr' }),
  });

  await loginAs(adminEmail);
  const issue = await request('http://localhost:3000/api/trpc/credentials.issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, type: 'qr' }),
  });
  console.log('ADMIN_ISSUE_STATUS', issue.status);
  const issueText = await issue.text();
  console.log('ADMIN_ISSUE_BODY', issueText);

  // Force a sensitive event to prove redaction for member-only users.
  const setSensitiveSql = `UPDATE member_log_events SET sensitive = 'true' WHERE person_id = '${personId}' AND event_type IN ('application_approved','membership_activated') ORDER BY occurred_at DESC LIMIT 1;`;
  const sqlUrl = 'http://localhost:3000/api/trpc/ping';
  console.log('SQL_UPDATE_SKIPPED');

  // Actually issue the toggle through the database directly using fetch to the app endpoint isn't available,
  // so we validate via a direct Postgres update instead.
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const postgres = (await import('postgres')).default;
  const connection = postgres('postgresql://libraryos:neha398@localhost:5433/libraryos');
  const db = drizzle(connection);
  const { memberLogEvents } = await import('./src/server/db/schema/index.ts');
  const { eq, and } = await import('drizzle-orm');
  await db.update(memberLogEvents)
    .set({ sensitive: 'true' })
    .where(and(eq(memberLogEvents.personId, personId), eq(memberLogEvents.eventType, 'application_approved')));
  await connection.end();

  const authCookie = cookies;
  cookies.clear();
  await loginAs(memberEmail);
  const log = await request('http://localhost:3000/api/trpc/memberLogCard.getForPerson?input=' + encodeURIComponent(JSON.stringify({ personId })));
  console.log('MEMBER_LOG_STATUS', log.status);
  console.log('MEMBER_LOG_BODY', await log.text());
})();
