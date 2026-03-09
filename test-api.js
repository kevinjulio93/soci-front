const fetch = require('node-fetch');

async function testParam(paramName, paramValue) {
  const url = `https://prueba-api.contactodirectocol.com/api/v1/respondents/reports/by-socializer-date?startDate=2026-03-05&endDate=2026-03-08&${paramName}=${paramValue}`;
  console.log('Testing:', url);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log(`Success with ${paramName}: returned ${data.data?.surveys?.length} surveys`);
    } else {
      console.log(`Failed with ${paramName}: ${res.status}`);
    }
  } catch (e) {
    console.error(`Error with ${paramName}:`, e.message);
  }
}

async function run() {
  await testParam('metric', 'linkedHomes');
  await testParam('filter', 'linkedHomes');
  await testParam('status', 'linkedHomes');
  await testParam('type', 'linkedHomes');
  await testParam('category', 'linkedHomes');
}

run();
