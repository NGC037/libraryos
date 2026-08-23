const cookies = new Map();
async function request(url, init = {}) {
  const headers = new Headers(init.headers || {});
  if (cookies.size) {
    headers.set('Cookie', Array.from(cookies.entries()).map(([k, v]) => k + '=' + v).join('; '));
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

(async () => {
  const csrfRes = await request('http://localhost:3000/api/auth/csrf');
  const csrf = await csrfRes.json();
  console.log('CSRF_STATUS', csrfRes.status);
  console.log('CSRF_TOKEN', csrf.csrfToken);

  const loginBody = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: 'neha@example.com',
    callbackUrl: 'http://localhost:3000',
    json: 'true'
  }).toString();

  const loginRes = await request('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: loginBody,
    redirect: 'manual'
  });
  console.log('LOGIN_STATUS', loginRes.status, loginRes.headers.get('location'));
  console.log('LOGIN_TEXT', await loginRes.text());

  const who = await request('http://localhost:3000/api/trpc/whoAmI');
  console.log('WHOAMI_STATUS', who.status);
  console.log('WHOAMI_BODY', await who.text());

  const branchId = 'd0c23c30-a5d0-4834-b3d9-ef989a04f67c';

  const start = await request('http://localhost:3000/api/trpc/onboarding.startApplication', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId, memberType: 'external_patron', fields: {} })
  });
  console.log('START_STATUS', start.status);
  const startText = await start.text();
  console.log('START_BODY', startText);
  const startJson = JSON.parse(startText);
  const applicationId = startJson.result.data.id;
  console.log('APP_ID', applicationId);

  const submit = await request('http://localhost:3000/api/trpc/onboarding.submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId })
  });
  console.log('SUBMIT_STATUS', submit.status);
  console.log('SUBMIT_BODY', await submit.text());

  const approve = await request('http://localhost:3000/api/trpc/onboarding.approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId, fullName: 'Test Patron', email: 'testpatron@example.com', roleKey: 'member' })
  });
  console.log('APPROVE_STATUS', approve.status);
  const approveText = await approve.text();
  console.log('APPROVE_BODY', approveText);
  const approveJson = JSON.parse(approveText);
  const personId = approveJson.result.data.personId;
  console.log('PERSON_ID', personId);

  const log = await request('http://localhost:3000/api/trpc/memberLogCard.getForPerson?input=' + encodeURIComponent(JSON.stringify({ personId })));
  console.log('LOG_STATUS', log.status);
  console.log('LOG_BODY', await log.text());
})();
