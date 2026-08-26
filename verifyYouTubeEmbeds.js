const https = require('https')

const uniqueIds = [
  'GLgKkG44MGo', // Soleus pushups & glucose walk
  'NivjpZ0VBro', // VILPA & VO2 Max 4x4
  'Dyid7vWO0zI', // Zone 2 Cardio
  '5kkBgb426Aw', // Cold Plunge & Cold Exposure Guide
  'pZX8ikmWvEU', // Sauna & Hyperthermic Conditioning
  'gz4G31LGyog', // 4-7-8 Breathing
  'rBdhqBGqiMc', // Cyclic Sighing
  'ibGpierkYdI', // Box Breathing
  'pE8TH8hZ-48'  // Andrew Huberman Protocol Guide
]

function checkYoutubeOembed(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
          try {
            const data = JSON.parse(body)
            resolve({ videoId, valid: true, title: data.title })
          } catch (e) {
            resolve({ videoId, valid: false })
          }
        })
      } else {
        resolve({ videoId, valid: false, status: res.statusCode })
      }
    }).on('error', () => resolve({ videoId, valid: false }))
  })
}

async function testAll() {
  console.log('Testing all catalog video IDs...')
  for (const id of uniqueIds) {
    const res = await checkYoutubeOembed(id)
    console.log(`${id}: ${res.valid ? '✅ VALID -> ' + res.title : '❌ INVALID (' + res.status + ')'}`)
  }
}

testAll()
