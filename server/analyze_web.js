const https = require('https');

https.get('https://desaparecidosterremotovenezuela.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Buscar URLs de API o JSON
    const urls = data.match(/https?:\/\/[^\s"'`]+/g) || [];
    const uniqueUrls = [...new Set(urls)].filter(u => u.includes('api') || u.includes('json') || u.includes('.com'));
    
    // Buscar arreglos de objetos que parezcan personas
    let foundData = [];
    const matches = data.match(/\{[^{}]*nombre[^{}]*\}/gi);
    if (matches) foundData = matches.slice(0, 10);
    
    console.log("URLs encontradas:");
    console.log(uniqueUrls);
    console.log("\nPosibles objetos de datos:");
    console.log(foundData);
    
    // Veamos si hay alguna mención a un endpoint en los strings JS
    const endpoints = data.match(/['"`]\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+['"`]/g) || [];
    console.log("\nPosibles endpoints locales:");
    console.log([...new Set(endpoints)].slice(0, 20));
  });
}).on('error', (e) => {
  console.error(e);
});
