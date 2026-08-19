const fs = require('fs');

const physioTestingBatch = {
  single_leg_balance: {
    youtubeVideoId: 'PzaeZjsVs5Q',
    videoStartSeconds: 0,
    videoTitle: 'One-Leg Stance Protocol (CSEP Guidelines)'
  },
  single_leg_stance: {
    youtubeVideoId: 'PzaeZjsVs5Q',
    videoStartSeconds: 0,
    videoTitle: 'One-Leg Stance Protocol (CSEP Guidelines)'
  },
  chair_stand_30s: {
    youtubeVideoId: 'qkV0UvjXgcs',
    videoStartSeconds: 0,
    videoTitle: '30-Second Chair Stand Test (CDC STEADI Official)'
  },
  '30s_chair_stand': {
    youtubeVideoId: 'qkV0UvjXgcs',
    videoStartSeconds: 0,
    videoTitle: '30-Second Chair Stand Test (CDC STEADI Official)'
  },
  sitting_rising_test: {
    youtubeVideoId: 'wfodHY9wucs',
    videoStartSeconds: 0,
    videoTitle: 'Sitting-Rising Test (SRT) - Dr. Claudio Gil Araujo Official Protocol'
  },
  gait_speed: {
    youtubeVideoId: 'xLScK_NXUN0',
    videoStartSeconds: 0,
    videoTitle: 'NIH Toolbox 4-Meter Walk Gait Speed Test'
  },
  usual_gait_speed: {
    youtubeVideoId: 'xLScK_NXUN0',
    videoStartSeconds: 0,
    videoTitle: 'NIH Toolbox 4-Meter Walk Gait Speed Test'
  },
  handgrip_strength: {
    youtubeVideoId: 'WcLgfUOUrPk',
    videoStartSeconds: 0,
    videoTitle: 'Grip Strength Measurement with Grip Dynamometer'
  },
  grip_strength: {
    youtubeVideoId: 'WcLgfUOUrPk',
    videoStartSeconds: 0,
    videoTitle: 'Grip Strength Measurement with Grip Dynamometer'
  }
};

const filePath = 'lib/data/modalityVideos.ts';
let code = fs.readFileSync(filePath, 'utf8');

Object.entries(physioTestingBatch).forEach(([key, val]) => {
  const keyQuote = `'${key}':`;
  const keyPlain = `${key}:`;
  if (!code.includes(keyQuote) && !code.includes(keyPlain)) {
    const insertStr = `  '${key}': {\n    youtubeVideoId: '${val.youtubeVideoId}',\n    videoStartSeconds: ${val.videoStartSeconds},\n    videoTitle: '${val.videoTitle.replace(/'/g, "\\'")}'\n  },\n`;
    code = code.replace('export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {', 'export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {\n' + insertStr);
  }
});

// Update fuzzy search triggers in getModalityVideoInfo
if (!code.includes("searchStr.includes('single_leg')")) {
  const triggerCode = `  if (searchStr.includes('single_leg') || searchStr.includes('single leg') || searchStr.includes('balance')) {
    return MODALITY_VIDEOS['single_leg_balance']
  }

  if (searchStr.includes('chair_stand') || searchStr.includes('chair stand')) {
    return MODALITY_VIDEOS['chair_stand_30s']
  }

  if (searchStr.includes('gait') || searchStr.includes('4m_walk') || searchStr.includes('walking speed')) {
    return MODALITY_VIDEOS['gait_speed']
  }

  if (searchStr.includes('grip') || searchStr.includes('handgrip')) {
    return MODALITY_VIDEOS['handgrip_strength']
  }

`;
  code = code.replace("if (searchStr.includes('soleus')", triggerCode + "  if (searchStr.includes('soleus')");
}

fs.writeFileSync(filePath, code);
console.log('Successfully integrated physiological testing videos into modalityVideos.ts');
