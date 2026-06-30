const https = require('https');

https.get('https://desaparecidosterremotovenezuela.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const scripts = data.match(/src="(\/_next\/static\/chunks\/[^"]+)"/g) || [];
    const urls = scripts.map(s => s.split('"')[1]);
    console.log("JS files found:");
    console.log(urls);
    
    // Download first few important ones
    urls.forEach(url => {
      https.get(`https://desaparecidosterremotovenezuela.com${url}`, (r) => {
        let jsData = '';
        r.on('data', c => jsData += c);
        r.on('end', () => {
          if (jsData.includes('supabase')) console.log(`Found supabase in ${url}`);
          if (jsData.includes('firebase')) console.log(`Found firebase in ${url}`);
          if (jsData.includes('anon_key')) console.log(`Found anon_key in ${url}`);
          if (jsData.includes('/api/')) console.log(`Found /api/ in ${url}`);
        });
      });
    });
  });
});
