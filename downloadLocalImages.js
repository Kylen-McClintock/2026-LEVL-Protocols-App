const fs = require('fs');
const https = require('https');
const path = require('path');

const imgDir = path.join(process.cwd(), 'public', 'images', 'modalities');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

const doc1 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8682/content.md', 'utf8');
const doc2 = fs.readFileSync('/Users/kylenmcclintock/.gemini/antigravity-ide/brain/93afc293-0e8a-432f-aa9c-09556efd4195/.system_generated/steps/8727/content.md', 'utf8');

const doc1Images = doc1.match(/<img[^>]+src="([^"]+)"/g) || [];
const doc2Images = doc2.match(/<img[^>]+src="([^"]+)"/g) || [];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, response => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const getSrc = (tag) => {
    if (!tag) return null;
    const m = tag.match(/src="([^"]+)"/);
    return m ? m[1] : null;
  };

  const imagesToFetch = [
    { targetIds: ['sauna_exposure', 'hyperthermic_sauna', 'rhonda_hyperthermic_sauna'], url: getSrc(doc1Images[0]), filename: 'sauna_hemodynamics.jpg' },
    { targetIds: ['soberg_reheating_principle'], url: getSrc(doc1Images[1]), filename: 'soberg_reheating.jpg' },
    { targetIds: ['contrast_hydrotherapy'], url: getSrc(doc1Images[2]), filename: 'contrast_hydrotherapy.jpg' },
    { targetIds: ['cyclic_hyperventilation', 'wim_hof_cyclic_retention_breathwork'], url: getSrc(doc1Images[3]), filename: 'wim_hof_breathwork.jpg' },
    { targetIds: ['sitting_rising_test'], url: getSrc(doc2Images[0]), filename: 'sitting_rising_test.jpg' },
    { targetIds: ['bp_sys', 'bp_dia', 'resting_bp', 'abpm-24h-blood-pressure-monitor'], url: getSrc(doc2Images[1]), filename: 'blood_pressure_abpm.jpg' }
  ];

  const mods = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));

  for (const item of imagesToFetch) {
    if (item.url) {
      const destPath = path.join(imgDir, item.filename);
      const localUrlPath = `/images/modalities/${item.filename}`;
      try {
        await downloadFile(item.url, destPath);
        const stats = fs.statSync(destPath);
        console.log(`Downloaded image -> ${localUrlPath} (Size: ${stats.size} bytes)`);

        item.targetIds.forEach(id => {
          const idx = mods.findIndex(m => m.id === id);
          if (idx !== -1) {
            mods[idx].diagram_url = localUrlPath;
            mods[idx].image_url = localUrlPath;
            console.log(`  Assigned diagram_url to modality: ${id}`);
          }
        });
      } catch (err) {
        console.error(`Failed to download ${item.filename}:`, err.message);
      }
    }
  }

  fs.writeFileSync('all_modalities.json', JSON.stringify(mods, null, 2));
  console.log('Successfully updated all_modalities.json with local image paths!');
}

run();
