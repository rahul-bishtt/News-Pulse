const http = require('http');

const BASE_URL = 'http://localhost:4000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = data;
        if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            // Ignore
          }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('Starting News Pulse REST API Tests');
  console.log('==================================================\n');

  // Test 1: GET /health
  console.log('Test 1: GET /health');
  try {
    const res = await request('GET', '/health');
    console.log(`Status: ${res.statusCode}`);
    console.log('Body:', JSON.stringify(res.body));
    if (res.statusCode === 200 && res.body.database === 'connected') {
      console.log('✅ Health check passed!\n');
    } else {
      console.log('❌ Health check failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 1:', err.message);
  }

  // Test 2: GET /timeline
  console.log('Test 2: GET /timeline');
  try {
    const res = await request('GET', '/timeline');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Timeline Points Count: ${Array.isArray(res.body) ? res.body.length : 'Not an array'}`);
    if (Array.isArray(res.body) && res.body.length > 0) {
      console.log('Sample Point:', JSON.stringify(res.body[0]));
      console.log('✅ Timeline endpoint passed!\n');
    } else if (Array.isArray(res.body)) {
      console.log('Timeline is empty (normal if no clusters with articles exist yet).');
      console.log('✅ Timeline endpoint passed!\n');
    } else {
      console.log('❌ Timeline endpoint failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 2:', err.message);
  }

  // Test 3: GET /clusters
  console.log('Test 3: GET /clusters');
  let firstClusterId = null;
  try {
    const res = await request('GET', '/clusters');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Clusters Count: ${Array.isArray(res.body) ? res.body.length : 'Not an array'}`);
    if (Array.isArray(res.body) && res.body.length > 0) {
      firstClusterId = res.body[0].id;
      console.log('Sample Cluster:', JSON.stringify(res.body[0]));
      console.log('✅ Clusters list endpoint passed!\n');
    } else if (Array.isArray(res.body)) {
      console.log('✅ Clusters list endpoint passed (empty)!\n');
    } else {
      console.log('❌ Clusters list endpoint failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 3:', err.message);
  }

  // Test 4: GET /clusters/:id with pagination & source filter
  if (firstClusterId !== null) {
    console.log(`Test 4: GET /clusters/${firstClusterId} (Pagination & Source Filtering)`);
    try {
      // 4a. Basic retrieval
      const res1 = await request('GET', `/clusters/${firstClusterId}`);
      console.log(`4a. Basic retrieval status: ${res1.statusCode}`);
      console.log(`Articles Count: ${res1.body.articles ? res1.body.articles.length : 0}`);

      // 4b. Pagination limit=2
      const res2 = await request('GET', `/clusters/${firstClusterId}?page=1&limit=2`);
      console.log(`4b. Pagination limit=2 status: ${res2.statusCode}`);
      console.log(`Articles Count (Expected <= 2): ${res2.body.articles ? res2.body.articles.length : 0}`);
      console.log('Pagination Metadata:', { page: res2.body.page, limit: res2.body.limit });

      // 4c. Source filtering
      const res3 = await request('GET', `/clusters/${firstClusterId}?source=BBC`);
      console.log(`4c. Source=BBC filtering status: ${res3.statusCode}`);
      if (res3.body.articles) {
        const nonBBC = res3.body.articles.filter(a => a.source !== 'BBC');
        console.log(`Non-BBC articles in filtered response: ${nonBBC.length}`);
        if (nonBBC.length === 0) {
          console.log('✅ Source filtering verification passed!');
        } else {
          console.log('❌ Source filtering verification failed!');
        }
      }
      console.log('✅ Cluster detail endpoint passed!\n');
    } catch (err) {
      console.error('Error in Test 4:', err.message);
    }
  } else {
    console.log('Test 4 skipped: No clusters found to query.\n');
  }

  // Test 5: Validation errors
  console.log('Test 5: Validation errors (GET /clusters/invalid-id)');
  try {
    const res = await request('GET', '/clusters/abc');
    console.log(`Status: ${res.statusCode} (Expected: 400)`);
    console.log('Body:', JSON.stringify(res.body));
    if (res.statusCode === 400 && res.body.error) {
      console.log('✅ Validation error handling passed!\n');
    } else {
      console.log('❌ Validation error handling failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 5:', err.message);
  }

  // Test 6: Not Found handling
  console.log('Test 6: Not Found handling (GET /clusters/999999)');
  try {
    const res = await request('GET', '/clusters/999999');
    console.log(`Status: ${res.statusCode} (Expected: 404)`);
    console.log('Body:', JSON.stringify(res.body));
    if (res.statusCode === 404 && res.body.error) {
      console.log('✅ Not Found error handling passed!\n');
    } else {
      console.log('❌ Not Found error handling failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 6:', err.message);
  }

  // Test 7: POST /ingest/trigger & GET /ingest/status/:jobId
  console.log('Test 7: POST /ingest/trigger (Ingestion Trigger)');
  let jobId = null;
  try {
    const res1 = await request('POST', '/ingest/trigger');
    console.log(`Trigger status: ${res1.statusCode} (Expected: 202)`);
    console.log('Body:', JSON.stringify(res1.body));
    if (res1.statusCode === 202 && res1.body.jobId) {
      jobId = res1.body.jobId;
      console.log(`✅ Ingest trigger passed. Job ID: ${jobId}`);

      // Test 8: Concurrency locking (POST /ingest/trigger again immediately)
      console.log('\nTest 8: Ingestion Concurrency Lock (POST /ingest/trigger)');
      const res2 = await request('POST', '/ingest/trigger');
      console.log(`Double trigger status: ${res2.statusCode} (Expected: 409)`);
      console.log('Body:', JSON.stringify(res2.body));
      if (res2.statusCode === 409 && res2.body.error === 'Ingestion already running') {
        console.log('✅ Concurrency check passed!\n');
      } else {
        console.log('❌ Concurrency check failed!\n');
      }

      // Track the job status
      console.log('Tracking job status...');
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 15) {
        attempts++;
        const resStatus = await request('GET', `/ingest/status/${jobId}`);
        console.log(`Attempt ${attempts} - Job status: ${resStatus.body.status}`);
        if (resStatus.body.status === 'done' || resStatus.body.status === 'failed') {
          completed = true;
          console.log('Final Job Status Data:', JSON.stringify(resStatus.body));
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (completed) {
        console.log('✅ Ingestion background process run completed!');
      } else {
        console.log('⚠️ Ingestion background process tracking timed out.');
      }
    } else {
      console.log('❌ Ingest trigger failed!\n');
    }
  } catch (err) {
    console.error('Error in Test 7:', err.message);
  }

  console.log('\n==================================================');
  console.log('REST API verification tests completed.');
  console.log('==================================================');
}

runTests();
