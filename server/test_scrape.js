const https = require('https');

https.get('https://redayudavenezuela.com', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data.slice(0, 1500)));
});
