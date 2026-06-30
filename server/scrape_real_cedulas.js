const fs = require('fs');

async function run() {
  const prefixes = [
    'mar', 'jos', 'car', 'lui', 'ana', 'jua', 'ped', 'jes', 'ale', 'fra', 
    'dan', 'dav', 'gab', 'mig', 'rob', 'ric', 'fer', 'edu', 'die', 'raf',
    'and', 'vic', 'hec', 'man', 'osc', 'rub', 'gui', 'hug', 'jor', 'ign',
    'sof', 'val', 'cam', 'luc', 'mar', 'pat', 'dian', 'eli', 'blan', 'glor'
  ];
  
  let allPeople = [];
  let seen = new Set();
  
  console.log("Scraping real data from redayudavenezuela.com...");
  
  for (const prefix of prefixes) {
    try {
      const res = await fetch('https://redayudavenezuela.com/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'search_people', term: prefix })
      });
      const json = await res.json();
      
      if (json.data && Array.isArray(json.data)) {
        for (const person of json.data) {
          const key = person.name + '_' + person.detail;
          if (!seen.has(key)) {
            seen.add(key);
            allPeople.push(person);
          }
        }
      }
    } catch (e) {
      console.log(`Failed for prefix ${prefix}`);
    }
  }
  
  console.log(`Total unique people scraped: ${allPeople.length}`);
  fs.writeFileSync('real_people_with_cedulas.json', JSON.stringify(allPeople, null, 2), 'utf8');
}

run();
