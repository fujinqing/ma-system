const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/positions',
  method: 'GET'
};

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
      
      if (data.success) {
        console.log(`\n✅ API 调用成功！`);
        console.log(`职位数量：${data.data ? data.data.length : 0}`);
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
});

req.end();
