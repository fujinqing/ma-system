const http = require('http');

// 测试创建职位 API
const testData = {
  position_code: 'TEST_API',
  position_name: 'API 测试职位',
  department_id: null,
  position_type: 'common',
  description: '通过 API 测试创建',
  sort_order: 999,
  status: 'active'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/positions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token'
  }
};

console.log('正在测试创建职位 API...');
console.log('请求数据:', testData);
console.log('---');

const req = http.request(options, (res) => {
  console.log(`状态码：${res.statusCode}`);
  console.log(`响应头：${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\n响应内容:');
    try {
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
      
      if (res.statusCode === 200 && data.success) {
        console.log('\n✅ 创建职位成功！');
        console.log(`职位代码：${testData.position_code}`);
        console.log(`职位名称：${testData.position_name}`);
      } else if (res.statusCode === 401) {
        console.log('\n⚠️  需要身份验证（这是正常的，因为有 auth 中间件）');
        console.log('请确保已登录系统并获取有效的 token');
      } else {
        console.log(`\n❌ API 返回失败：${data.message}`);
      }
    } catch (e) {
      console.log('无法解析 JSON:', e);
      console.log('原始响应:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误：${e.message}`);
  console.log('\n可能的原因：');
  console.log('1. 后端服务器未启动');
  console.log('2. 服务器端口不是 3005');
  console.log('3. 路由未正确注册');
});

req.write(postData);
req.end();
