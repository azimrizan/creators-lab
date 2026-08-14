export interface TranscriptChunk {
  id: string;
  timestampStart: string;
  timestampEnd: string;
  topic: string;
  content: string;
  keywords: string[];
}

export interface VideoMCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  timestamp: string;
}

export const VISUAL_STORYTELLING_TRANSCRIPT_CHUNKS: TranscriptChunk[] = [
  {
    id: 'chunk-1',
    timestampStart: '00:00:31',
    timestampEnd: '00:01:48',
    topic: 'Introduction to Composition & The Rule of Thirds',
    content: `Framing or composition is as relevant in film as it is in paintings, illustration, or graphic design. We use shapes, alignment, and composition to guide the viewer's eye to what we want it to see. The golden rule of composition is the Rule of Thirds. Dividing the frame into 3 vertical and horizontal segments and placing objects of interest on intersecting points creates a visually pleasing image.`,
    keywords: ['composition', 'framing', 'rule of thirds', 'intersecting points', 'golden rule', 'balance']
  },
  {
    id: 'chunk-2',
    timestampStart: '00:01:48',
    timestampEnd: '00:03:00',
    topic: 'Placing Eyes on Intersecting Points & Head Crop',
    content: `In close-ups, placing the subject's eyes on intersecting points draws maximum attention. The eyes are the windows to the soul. As long as the eyes are sharp and in focus on these points, filmmakers can even sacrifice headroom and chop off the top of somebody's head in the frame without losing shot quality.`,
    keywords: ['eyes', 'close-up', 'intersecting points', 'headroom', 'focus', 'windows to the soul']
  },
  {
    id: 'chunk-3',
    timestampStart: '00:03:01',
    timestampEnd: '00:03:40',
    topic: 'Central Framing & One-Point Perspective (Kubrick & Wes Anderson)',
    content: `Central framing places the subject directly in the center. It is ideal for fast-paced editing so the viewer's eye doesn't have to wander. It enables one-point perspective using leading lines and symmetry, famous in Stanley Kubrick and Wes Anderson films, creating a faux 3D depth effect.`,
    keywords: ['central framing', 'one-point perspective', 'Stanley Kubrick', 'Wes Anderson', 'symmetry', 'leading lines', '3D effect']
  },
  {
    id: 'chunk-4',
    timestampStart: '00:03:41',
    timestampEnd: '00:04:31',
    topic: 'Leading Lines & Depth of Field',
    content: `Leading lines use natural lines in the frame to direct the viewer's eyes toward the main subject. Shallow depth of field denotes character importance and inner emotion. Extreme close-ups convey high importance, while wide shots shrink the subject to show vulnerability or insignificance.`,
    keywords: ['leading lines', 'depth of field', 'shallow depth of field', 'extreme close-up', 'vulnerability', 'wide shot']
  },
  {
    id: 'chunk-5',
    timestampStart: '00:04:32',
    timestampEnd: '00:05:05',
    topic: 'Light, Contrast & Lead Space',
    content: `The human eye is naturally drawn to brighter objects in a frame. Spotlights or eye-lights in a dark frame pull attention immediately. Lead space means if a character looks left, place them on the right side of the frame so they look into empty enter space.`,
    keywords: ['light', 'contrast', 'lead space', 'looking room', 'eye light', 'framing within frame']
  },
  {
    id: 'chunk-6',
    timestampStart: '00:05:45',
    timestampEnd: '00:06:53',
    topic: 'Wide Shots, Full Shots & Cowboy Shot',
    content: `10mm is extreme wide-angle, 18mm is practical establishing wide shot. Full shot shows body top-to-toe with padding. Medium-long shot frames from knees to head (never cut at the feet). Cowboy shot frames from just below the crotch to allow seeing gun holsters.`,
    keywords: ['wide shot', 'establishing shot', 'full shot', 'medium long', 'cowboy shot', 'framing']
  },
  {
    id: 'chunk-7',
    timestampStart: '00:06:53',
    timestampEnd: '00:08:09',
    topic: 'Medium Shot (50mm), MCU, Close-Up, Choker & Macro',
    content: `50mm lens on full-frame matches human eye field of view. Medium Close-Up (MCU) is standard for interviews and dialogue. Close-up is tightest shot before cutting top of head. Choker cuts top of head and below chin. Extreme close-up keeps eyes and mouth in frame for heightened emotion. Macro is ultra close (e.g. eye reflections).`,
    keywords: ['50mm', 'medium shot', 'MCU', 'close-up', 'choker', 'extreme close-up', 'macro', 'human eye']
  },
  {
    id: 'chunk-8',
    timestampStart: '00:08:11',
    timestampEnd: '00:10:20',
    topic: 'Lens Focal Length Compression (Telephoto vs Wide)',
    content: `Longer telephoto lenses (e.g. 300mm-400mm) narrow field of view, blur background, and pull the background dramatically closer to the subject (background compression). Example: 400mm shot on Brighton Beach makes waves look dangerously close to kids when they are actually far away.`,
    keywords: ['telephoto', 'lens compression', '300mm', '400mm', 'background compression', 'Brighton Beach']
  },
  {
    id: 'chunk-9',
    timestampStart: '00:10:29',
    timestampEnd: '00:12:12',
    topic: 'Facial Distortion & Portrait Range Lenses',
    content: `50mm to 90mm (especially ~85mm) is the natural portrait range that represents human faces accurately as seen in real life. Super wide-angle lenses distort features, widening the face and enlarging the nose unnaturally.`,
    keywords: ['facial distortion', 'portrait range', '85mm', '50mm-90mm', 'wide angle distortion']
  }
];

export const VISUAL_STORYTELLING_10_MCQS: VideoMCQQuestion[] = [
  {
    id: 'vsq-1',
    question: 'What is considered the golden rule of visual composition in filmmaking?',
    options: [
      'The Rule of Thirds',
      'The Golden Spiral Ratio',
      'The Rule of Quadrants',
      'The Center Symmetry Rule'
    ],
    correctOptionIndex: 0,
    explanation: 'The Rule of Thirds divides the frame into 3 vertical and horizontal segments. Placing subjects on intersecting points creates natural, balanced compositions (00:01:42).',
    timestamp: '00:01:42'
  },
  {
    id: 'vsq-2',
    question: 'In close-up framing, where should the character\'s eyes ideally be placed to draw maximum audience attention?',
    options: [
      'Directly on the top border line',
      'On the intersecting grid points of the Rule of Thirds',
      'In the exact mathematical center of the screen',
      'In the bottom-right corner'
    ],
    correctOptionIndex: 1,
    explanation: 'As "windows to the soul", placing eyes on intersecting points immediately guides the viewer\'s focus. You can even cut off headroom as long as eyes are sharp (00:02:26).',
    timestamp: '00:02:26'
  },
  {
    id: 'vsq-3',
    question: 'Which cinematic style, famously used by Stanley Kubrick and Wes Anderson, uses central framing and leading lines to create a faux 3D feel?',
    options: [
      'Two-point Perspective',
      'Dutch Angle Tilt',
      'One-Point Perspective',
      'Over-the-shoulder Framing'
    ],
    correctOptionIndex: 2,
    explanation: 'Central framing combined with symmetry and leading lines creates a one-point perspective that draws viewers deep into the 3D depth of the frame (00:03:22).',
    timestamp: '00:03:22'
  },
  {
    id: 'vsq-4',
    question: 'What is the compositional concept of "Lead Space" (or Looking Room)?',
    options: [
      'Leaving space behind a character when they run fast',
      'Placing a character looking left onto the right side of the frame so they look into open space',
      'Filling 100% of the frame with lead weights',
      'Cutting off the sides of the video to create a 4:3 square aspect ratio'
    ],
    correctOptionIndex: 1,
    explanation: 'If a character looks to the left, positioning them on the right side of the frame lets them look into the empty lead space, creating a natural look (00:04:50).',
    timestamp: '00:04:50'
  },
  {
    id: 'vsq-5',
    question: 'Which lens focal length on a full-frame camera sensor closely matches the standard field of view of the human eye?',
    options: ['18mm', '50mm', '135mm', '400mm'],
    correctOptionIndex: 1,
    explanation: 'A 50mm lens on a full-frame sensor (or 35mm on a Super35 crop) provides a natural field of view equivalent to human vision (00:06:53).',
    timestamp: '00:06:53'
  },
  {
    id: 'vsq-6',
    question: 'What defines a "Cowboy Shot" in film terminology?',
    options: [
      'A extreme close-up of a cowboy hat',
      'Framing from just around the crotch/thighs up to see gun holsters',
      'A wide shot featuring horses',
      'Framing strictly from the shoulders to top of head'
    ],
    correctOptionIndex: 1,
    explanation: 'Originating from Western films, the cowboy shot frames from the crotch upward so the audience can see gun holsters clearly (00:06:29).',
    timestamp: '00:06:29'
  },
  {
    id: 'vsq-7',
    question: 'How is a "Choker" shot framed differently than a standard close-up?',
    options: [
      'It shows the full chest and hands',
      'It is framed tightly just above the choker line, cutting off the top of the head and just below the chin',
      'It is shot from behind the neck',
      'It uses an extreme fish-eye wide angle lens'
    ],
    correctOptionIndex: 1,
    explanation: 'A choker is a tight close-up that trims the top of the head and rests right beneath the chin line (00:07:24).',
    timestamp: '00:07:24'
  },
  {
    id: 'vsq-8',
    question: 'What optical effect happens when using a long telephoto lens (e.g. 300mm – 400mm)?',
    options: [
      'It pushes the background further away, expanding space',
      'It pulls the background closer to the subject (background compression)',
      'It turns the image into black and white',
      'It distorts the center of the image into a circle'
    ],
    correctOptionIndex: 1,
    explanation: 'Long telephoto lenses compress space, pulling distant backgrounds forward to make them appear right behind the subject (e.g. Brighton Beach waves) (00:09:35).',
    timestamp: '00:09:35'
  },
  {
    id: 'vsq-9',
    question: 'Which focal length range is widely regarded as the most natural and flattering "portrait range" for filming human faces without unnatural distortion?',
    options: [
      '10mm to 18mm',
      '50mm to 90mm (especially ~85mm)',
      '200mm to 500mm',
      '8mm fisheye'
    ],
    correctOptionIndex: 1,
    explanation: '50mm to 90mm (with ~85mm being ideal) represents facial structures realistically without widening noses or flattening features (00:11:21).',
    timestamp: '00:11:21'
  },
  {
    id: 'vsq-10',
    question: 'How do lighting and contrast affect visual storytelling according to the video?',
    options: [
      'The human eye is naturally pulled toward brighter objects in the frame',
      'Darker objects always draw the eye first',
      'Lighting has no impact on composition',
      'Bright lighting reduces viewer focus'
    ],
    correctOptionIndex: 0,
    explanation: 'High contrast and bright elements (like eye lights or spotlights in a dark room) naturally attract the viewer\'s focus to key points of interest (00:04:32).',
    timestamp: '00:04:32'
  }
];

export function getRelevantTranscriptChunks(query: string, maxChunks = 3): TranscriptChunk[] {
  const normalizedQuery = query.toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

  const scoredChunks = VISUAL_STORYTELLING_TRANSCRIPT_CHUNKS.map(chunk => {
    let score = 0;
    const combinedText = `${chunk.topic} ${chunk.content} ${chunk.keywords.join(' ')}`.toLowerCase();
    
    tokens.forEach(token => {
      if (combinedText.includes(token)) {
        score += 2;
      }
      if (chunk.keywords.some(k => k.toLowerCase().includes(token))) {
        score += 3;
      }
    });

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  const top = scoredChunks.filter(s => s.score > 0).map(s => s.chunk);
  if (top.length === 0) {
    return VISUAL_STROWTELLING_TRANSCRIPT_CHUNKS_DEFAULT();
  }
  return top.slice(0, maxChunks);
}

function VISUAL_STROWTELLING_TRANSCRIPT_CHUNKS_DEFAULT(): TranscriptChunk[] {
  return VISUAL_STORYTELLING_TRANSCRIPT_CHUNKS.slice(0, 3);
}
