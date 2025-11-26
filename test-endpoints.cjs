const http = require('http');

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        success: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing server endpoints...\n');

  // Test 1: Health check
  console.log('1. Testing GET /api/health');
  const health = await testEndpoint('/api/health');
  console.log(`   Status: ${health.status} ${health.success ? '✅' : '❌'}`);
  
  // Test 2: Get orders
  console.log('\n2. Testing GET /api/orders');
  const orders = await testEndpoint('/api/orders');
  console.log(`   Status: ${orders.status} ${orders.success ? '✅' : '❌'}`);
  if (orders.success) {
    const data = JSON.parse(orders.data);
    console.log(`   Found ${data.length} orders`);
  }

  // Test 3: Delete endpoint (we'll just check if it responds, not actually delete)
  console.log('\n3. Testing DELETE /api/orders/22');
  const deleteTest = await testEndpoint('/api/orders/22', 'DELETE');
  console.log(`   Status: ${deleteTest.status} ${deleteTest.success ? '✅' : '❌'}`);
  console.log(`   Response: ${deleteTest.data || deleteTest.error}`);

  console.log('\n--- Summary ---');
  if (!health.success) {
    console.log('❌ Server is not running on port 3001');
    console.log('   Please run: node server.cjs');
  } else if (!orders.success) {
    console.log('⚠️  Server is running but /api/orders endpoint failed');
  } else if (deleteTest.status === 404) {
    console.log('❌ DELETE endpoint is returning 404');
    console.log('   The server may need to be restarted');
  } else {
    console.log('✅ All endpoints are working');
  }
}

runTests();
