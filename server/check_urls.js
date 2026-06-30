const https = require('https');
const urls = [
  'https://redayudavenezuela.com',
  'https://venezuelatebusca.com',
  'https://busquedavzla.netlify.app',
  'https://reportevenezuela.com/',
  'https://osirisberbesia.com/pacientesinfo/',
  'https://venapp.com',
  'https://desaparecidosterremotovenezuela.com',
  'https://terremotovenezuela.com',
  'https://hospitalesenvenezuela.com',
  'https://pacientesterremotovzla.lovable.app',
  'https://ayudavenezuela2026.com',
  'https://rescate-ve.vercel.app',
  'https://refugiosvenezuela.com',
  'https://ayudaparavenezuela.com',
  'https://huellascan.com/terremoto',
  'https://ayudavenezuela.app/rescate'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 3000 }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, error: e.message });
    });
  });
}

Promise.all(urls.map(checkUrl)).then(results => console.log(results));
