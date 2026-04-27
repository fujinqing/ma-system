const http = require('http');

const postData = JSON.stringify({
  name: '测试小组',
  department_id: 3,
  headcount: 5,
  description: '测试描述'
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/teams',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (process.argv[2] || ''),
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing teams API...');
console.log('Post data:', postData);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
