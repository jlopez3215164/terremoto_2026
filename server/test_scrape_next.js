const https = require('https');
const zlib = require('zlib');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'Accept-Encoding': 'gzip, deflate' } }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        let encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          buffer = zlib.gunzipSync(buffer);
        } else if (encoding === 'deflate') {
          buffer = zlib.inflateSync(buffer);
        }
        resolve(buffer.toString('utf-8'));
      });
    }).on('error', () => resolve(''));
  });
}

async function run() {
  const data = await fetchUrl('https://redayudavenezuela.com');
  const matches = data.match(/self\.__next_f\.push\(\[1,"(.*?)\]\)/g) || [];
  console.log(`Found ${matches.length} next_f pushes`);
  
  // Let's just find anything resembling a person object
  // Looking for "nombre", "foto", "image", "edad", etc.
  const personas = data.match(/\{[^}]*"nombre"[^}]*\}/gi) || [];
  console.log(`Found ${personas.length} object-like strings with 'nombre'`);
  if (personas.length > 0) {
    console.log(personas[0]);
  } else {
    // Find generic strings that might be names
    const names = data.match(/"([^"]+)"/g) || [];
    console.log(`Found ${names.length} string literals.`);
    // print some long strings
    console.log(names.filter(n => n.length > 15 && n.length < 50).slice(0, 10));
  }
}
run();
