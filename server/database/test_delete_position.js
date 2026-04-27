const http = require('http');

// 测试删除职位 API
const testDeletePosition = (positionId) => {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: `/api/positions/${positionId}`,
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer mock-token-admin'
    }
  };

  console.log(`正在测试删除职位 API (ID: ${positionId})...`);
  console.log('---');

  const req = http.request(options, (res) => {
    console.log(`状态码：${res.statusCode}`);
    
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
          console.log('\n✅ 删除职位成功！');
        } else if (res.statusCode === 400) {
          console.log('\n⚠️  无法删除：', data.message);
        } else if (res.statusCode === 404) {
          console.log('\n❌ 职位不存在');
        } else {
          console.log(`\n❌ 删除失败：${data.message}`);
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

  req.end();
};

// 测试流程
console.log('========================================');
console.log('职位管理删除功能测试');
console.log('========================================\n');

// 先获取职位列表
const getOptions = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/positions',
  method: 'GET'
};

console.log('步骤 1: 获取职位列表...');
const getReq = http.request(getOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ 获取到 ${result.data.length} 个职位\n`);
        
        // 选择一个测试职位（选择最后一个）
        const testPosition = result.data[result.data.length - 1];
        console.log(`选择测试职位：${testPosition.position_name} (ID: ${testPosition.id})\n`);
        console.log('========================================\n');
        
        // 测试删除
        setTimeout(() => {
          testDeletePosition(testPosition.id);
        }, 1000);
      } else {
        console.log('❌ 没有可测试的职位');
      }
    } catch (e) {
      console.log('无法解析职位列表:', e);
    }
  });
});

getReq.on('error', (e) => {
  console.error(`获取职位列表失败：${e.message}`);
});

getReq.end();
