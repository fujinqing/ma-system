const fetch = require('node-fetch');

async function testAPI() {
  const token = 'test-token'; // 这里需要一个有效的 token
  
  console.log('=== 测试用户 API 端点 ===\n');
  
  // 测试获取用户列表
  try {
    const response = await fetch('http://localhost:3005/api/auth/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`GET /api/auth/users - ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

testAPI();
