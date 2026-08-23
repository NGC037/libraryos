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
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    callbackUrl: 'http://localhost:3000',
    json: 'true',
  }).toString();

  const loginRes = await request('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
  });

  if (loginRes.status !== 200 && loginRes.status !== 302) {
    throw new Error(`Login failed for ${email}: ${loginRes.status}`);
  }
}

(async () => {
  const personId = '072d5155-d1c4-46a9-95a3-61b8af26d912';
  const memberEmail = 'testpatron@example.com';
  const dbUrl = 'postgresql://libraryos:neha398@localhost:5433/libraryos';
  const postgres = (await import('postgres')).default;
  const sql = postgres(dbUrl);

  await sql`INSERT INTO user_accounts (id, person_id, auth_provider_id, status)
    VALUES (gen_random_uuid(), ${personId}, ${'credentials:' + memberEmail}, 'active')
    ON CONFLICT (auth_provider_id) DO NOTHING;`;

  await sql`UPDATE member_log_events
    SET sensitive = 'true'
    WHERE person_id = ${personId}
      AND event_type = 'application_approved';`;

  await loginAs('neha@example.com');
  const issue = await request('http://localhost:3000/api/trpc/credentials.issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, type: 'qr' }),
  });
  console.log('ADMIN_ISSUE_STATUS', issue.status);
  console.log('ADMIN_ISSUE_BODY', await issue.text());

  cookies.clear();
  await loginAs(memberEmail);

  const log = await request('http://localhost:3000/api/trpc/memberLogCard.getForPerson?input=' + encodeURIComponent(JSON.stringify({ personId })));
  console.log('MEMBER_LOG_STATUS', log.status);
  console.log('MEMBER_LOG_BODY', await log.text());

  await sql.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
