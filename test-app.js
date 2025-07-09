// Simple test script to verify the application is working
const BASE_URL = 'http://localhost:3000';

async function testEndpoint(method, url, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${url}:`, response.status, response.statusText);
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${url}:`, error.message);
    return null;
  }
}

async function testApp() {
  console.log('🧪 Testing Personal Dashboard Application...\n');
  
  // Test Dashboard API
  console.log('📊 Testing Dashboard API:');
  await testEndpoint('GET', '/api/dashboard/overview');
  
  // Test Tasks API
  console.log('\n✅ Testing Tasks API:');
  await testEndpoint('GET', '/api/tasks');
  await testEndpoint('GET', '/api/tasks/pending');
  await testEndpoint('GET', '/api/tasks/completed');
  await testEndpoint('GET', '/api/tasks/summary');
  
  // Test Finance API
  console.log('\n💰 Testing Finance API:');
  await testEndpoint('GET', '/api/finance/transactions');
  await testEndpoint('GET', '/api/finance/spending');
  
  // Test creating a task
  console.log('\n➕ Testing Task Creation:');
  const taskResult = await testEndpoint('POST', '/api/tasks', {
    title: 'Test Task from API',
    userId: 'user-1',
    dueDate: '2024-07-15'
  });
  
  if (taskResult?.task?.id) {
    console.log('✅ Task created successfully:', taskResult.task.id);
    
    // Test toggling task completion
    console.log('\n🔄 Testing Task Toggle:');
    await testEndpoint('POST', `/api/tasks/${taskResult.task.id}/toggle`, {
      completed: true
    });
  }
  
  // Test creating a transaction
  console.log('\n➕ Testing Transaction Creation:');
  const transactionResult = await testEndpoint('POST', '/api/finance/transactions', {
    amount: 25.50,
    category: 'groceries',
    description: 'Test transaction from API',
    userId: 'user-1',
    date: '2024-07-09'
  });
  
  if (transactionResult?.transaction?.id) {
    console.log('✅ Transaction created successfully:', transactionResult.transaction.id);
  }
  
  console.log('\n🎉 API tests completed!');
}

testApp().catch(console.error);