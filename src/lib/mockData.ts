import { Course, Category, User, Review, Order, Certificate, LessonQA } from './types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Cinematography & Directing',
    slug: 'cinematography-directing',
    icon: 'Video',
    subcategories: ['Visual Storytelling', 'Cinematic Lighting', 'Lens Choice & Framing', 'Commercial Directing', 'Camera Movement']
  },
  {
    id: 'cat-2',
    name: 'Photography & Visual Arts',
    slug: 'photography-visual-arts',
    icon: 'Camera',
    subcategories: ['Editorial Portraiture', 'Street Photography', 'Lighting Mastery', 'Lightroom Color Science', 'Composition']
  },
  {
    id: 'cat-3',
    name: 'Video Editing & Color Grading',
    slug: 'video-editing-color-grading',
    icon: 'Layers',
    subcategories: ['DaVinci Resolve', 'ACES Color Science', 'Premiere Pro Workflow', 'Sound Design & Pacing', 'Film Emulation']
  },
  {
    id: 'cat-4',
    name: '3D Animation & Motion Design',
    slug: 'motion-design-3d-vfx',
    icon: 'Sparkles',
    subcategories: ['Blender 3D Worlds', 'After Effects Kinetic Type', 'Cinema 4D Shading', 'Title Sequences', 'Unreal Engine 5']
  },
  {
    id: 'cat-5',
    name: 'Music Production & Sound Engineering',
    slug: 'music-production-audio',
    icon: 'Music',
    subcategories: ['Cinematic Film Scoring', 'Ableton Live', 'Foley & Sound Design', 'Analog Mixing & Mastering', 'Vocal Production']
  },
  {
    id: 'cat-6',
    name: 'UI/UX & Brand Creative Direction',
    slug: 'creative-direction-design',
    icon: 'Palette',
    subcategories: ['Creative Art Direction', 'Figma Design Systems', 'Editorial Typography', 'Brand Identity', 'Design Tokens']
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Maya Sharma',
    email: 'student@creatorslab.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    isBlocked: false,
    enrolledCourseIds: [],
    wishlistCourseIds: [],
    createdAt: '2026-01-15'
  },
  {
    id: 'user-2',
    name: 'Philip Bloom',
    email: 'instructor@creatorslab.com',
    role: 'INSTRUCTOR',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    bio: 'World-renowned Director of Photography, Cinematographer & Pioneer of DSLR Filmmaking.',
    isBlocked: false,
    enrolledCourseIds: [],
    wishlistCourseIds: [],
    createdAt: '2025-06-10'
  },
  {
    id: 'user-3',
    name: 'Super Admin',
    email: 'admin@creatorslab.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    isBlocked: false,
    enrolledCourseIds: [],
    wishlistCourseIds: [],
    createdAt: '2025-01-01'
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Cinematic Visual Storytelling: Composition, Lenses & Framing',
    slug: 'cinematic-visual-storytelling-composition-lenses',
    subtitle: 'Master camera language, Rule of Thirds, lens compression, contrast & visual storytelling techniques with legendary filmmaker Philip Bloom.',
    description: 'Learn foundational visual storytelling from acclaimed cinematographer Philip Bloom. Discover how to arrange subjects within the frame, harness focal length compression (10mm to 400mm), sculpt cinematic contrast, and direct audience attention with intentional lighting.',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3499,
    discountPrice: 699,
    status: 'PUBLISHED',
    level: 'BEGINNER',
    language: 'English',
    categoryId: 'cat-1',
    categoryName: 'Cinematography & Directing',
    subcategory: 'Visual Storytelling',
    tags: ['Cinematography', 'Filmmaking', 'Rule of Thirds', 'Lenses', 'Framing', 'Lighting'],
    instructorId: 'user-2',
    instructorName: 'Philip Bloom',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Master Cinematographer & Director',
    rating: 4.98,
    reviewCount: 2450,
    studentCount: 24800,
    whatYouWillLearn: [
      'Master composition techniques and the Rule of Thirds grid',
      'Understand framing styles: One-point perspective, Central framing & Lead space',
      'Choose the right lens focal lengths (10mm to 400mm) and handle lens compression',
      'Eliminate facial distortion using natural 50mm–90mm portrait range lenses',
      'Utilize shallow depth of field, contrast, and light to direct viewer attention'
    ],
    prerequisites: [
      'A digital camera or smartphone with manual video controls',
      'Passion for visual storytelling and cinema'
    ],
    sections: [
      {
        id: 'sec-1',
        title: 'Section 1: Visual Storytelling Foundations & Camera Language',
        order: 1,
        lessons: [
          {
            id: 'les-1',
            title: '1. Visual Storytelling 101: Composition, Lenses & Framing',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 815,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          },
          {
            id: 'les-2',
            title: '2. Lens Compression & Perspective Anatomy',
            order: 2,
            contentType: 'VIDEO',
            durationSeconds: 720,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          },
          {
            id: 'les-3',
            title: '3. Composition PDF Cheatsheet & Framing Guide',
            order: 3,
            contentType: 'PDF',
            durationSeconds: 300,
            videoUrl: '',
            isFreePreview: false,
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }
        ]
      },
      {
        id: 'sec-2',
        title: 'Section 2: Lighting Contrast & Visual Moods',
        order: 2,
        lessons: [
          {
            id: 'les-4',
            title: '4. Three-Point Lighting vs Cinematic Negative Fill',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 910,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: false
          },
          {
            id: 'les-5',
            title: '5. Assessment: Framing & Cinematography Quiz',
            order: 2,
            contentType: 'QUIZ',
            durationSeconds: 600,
            videoUrl: '',
            isFreePreview: false,
            quiz: {
              id: 'quiz-1',
              title: 'Cinematography & Framing Assessment',
              passingScorePercent: 70,
              timeLimitMinutes: 10,
              questions: [
                {
                  id: 'q1',
                  question: 'What is the primary visual effect of using a telephoto lens (e.g. 135mm or 200mm)?',
                  options: [
                    'It compresses the background and makes distant objects appear closer to the subject',
                    'It expands field of view and bends horizontal horizon lines',
                    'It automatically turns the footage black and white',
                    'It removes camera audio'
                  ],
                  correctOptionIndex: 0,
                  explanation: 'Telephoto lenses compress spatial depth and bring backgrounds closer while isolating the subject.'
                },
                {
                  id: 'q2',
                  question: 'Which focal length range provides the most natural proportions for human facial portraiture without distortion?',
                  options: ['12mm - 18mm', '50mm - 85mm', '400mm - 600mm', '8mm Fisheye'],
                  correctOptionIndex: 1,
                  explanation: '50mm to 85mm lenses closely replicate normal human eye perspective and avoid wide-angle facial distortion.'
                }
              ]
            }
          }
        ]
      }
    ],
    updatedAt: '2026-02-20'
  },
  {
    id: 'course-2',
    title: 'DaVinci Resolve Masterclass: Hollywood Color Grading & Color Science',
    slug: 'davinci-resolve-hollywood-color-grading',
    subtitle: 'Learn node trees, ACES color management, 35mm film emulation, skin tone matching, and HDR mastering.',
    description: 'Transform raw footage into rich cinematic films. Learn ACES color management, node structure, curves, hue vs sat qualifiers, color balance, 35mm print film emulation (Kodak 2383), and high-dynamic-range delivery.',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3999,
    discountPrice: 799,
    status: 'PUBLISHED',
    level: 'INTERMEDIATE',
    language: 'English',
    categoryId: 'cat-3',
    categoryName: 'Video Editing & Color Grading',
    subcategory: 'DaVinci Resolve',
    tags: ['Color Grading', 'DaVinci Resolve', 'ACES', 'Film Look', 'LUTs', 'Post-Production'],
    instructorId: 'user-2',
    instructorName: 'Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Lead Colorist & Post-Production Director',
    rating: 4.96,
    reviewCount: 1980,
    studentCount: 19800,
    whatYouWillLearn: [
      'Build non-destructive professional node graphs in DaVinci Resolve',
      'Master ACES and DaVinci YRGB Color Managed workflows',
      'Accurately isolate and protect skin tones using vectorscopes and curves',
      'Emulate authentic 16mm and 35mm Kodak film grain and halation'
    ],
    prerequisites: ['DaVinci Resolve Studio or Free version installed'],
    sections: [
      {
        id: 'sec-21',
        title: 'Section 1: Color Science & Primary Balance',
        order: 1,
        lessons: [
          {
            id: 'les-21',
            title: '1. Node Architectures & Scopes Breakdown',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 840,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-15'
  },
  {
    id: 'course-3',
    title: 'Masterclass in Editorial & Street Photography',
    slug: 'editorial-street-photography-masterclass',
    subtitle: 'Capture decisive moments, harness natural light, tell raw human stories, and master Lightroom color post-processing.',
    description: 'Elevate your photography portfolio. Learn how to work with natural street lighting, frame spontaneous moments, direct models in studio portraiture, and develop a signature Lightroom editing preset palette.',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 2999,
    discountPrice: 599,
    status: 'PUBLISHED',
    level: 'ALL_LEVELS',
    language: 'English',
    categoryId: 'cat-2',
    categoryName: 'Photography & Visual Arts',
    subcategory: 'Street Photography',
    tags: ['Photography', 'Street Photography', 'Lightroom', 'Portraiture', 'Lighting'],
    instructorId: 'user-2',
    instructorName: 'Marcus Thorne',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Documentary & Editorial Photographer',
    rating: 4.94,
    reviewCount: 1620,
    studentCount: 16200,
    whatYouWillLearn: [
      'Master manual camera exposure (Aperture, Shutter Speed, ISO triangle)',
      'Harness golden hour, harsh midday sun, and dynamic shadows',
      'Build a signature color palette and workflow in Adobe Lightroom',
      'Overcome approach anxiety in street and candid documentary portraiture'
    ],
    prerequisites: ['Any mirrorless, DSLR, or manual mode camera'],
    sections: [
      {
        id: 'sec-31',
        title: 'Section 1: The Decisive Moment & Street Aesthetics',
        order: 1,
        lessons: [
          {
            id: 'les-31',
            title: '1. Finding Geometry & Light in Everyday Urban Scenes',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 780,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-18'
  },
  {
    id: 'course-4',
    title: 'Blender 3D & Unreal Engine: Cinematic Worlds & Environment Design',
    slug: 'blender-3d-unreal-engine-cinematic-worlds',
    subtitle: 'Create photorealistic 3D environments, procedural lighting, volumetric shaders, and cinematic camera animations.',
    description: 'Step into modern 3D world-building. Master Blender geometry nodes, PBR material texturing, volumetric fog, Unreal Engine 5 Lumen lighting, and Hollywood-grade virtual production cameras.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3799,
    discountPrice: 749,
    status: 'PUBLISHED',
    level: 'INTERMEDIATE',
    language: 'English',
    categoryId: 'cat-4',
    categoryName: '3D Animation & Motion Design',
    subcategory: 'Blender 3D Worlds',
    tags: ['Blender', '3D Animation', 'Unreal Engine', 'VFX', 'Environment Design'],
    instructorId: 'user-2',
    instructorName: 'Kai Chen',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Senior 3D Art Director & VFX Artist',
    rating: 4.97,
    reviewCount: 2140,
    studentCount: 21400,
    whatYouWillLearn: [
      'Model photorealistic landscapes and sci-fi environments in Blender',
      'Create procedural shaders, volumetric clouds, and water surfaces',
      'Animate cinematic virtual cameras with realistic lens imperfections',
      'Render real-time interactive scenes in Unreal Engine 5'
    ],
    prerequisites: ['Free Blender 4.0+ software installed'],
    sections: [
      {
        id: 'sec-41',
        title: 'Section 1: 3D Composition & Lighting Fundamentals',
        order: 1,
        lessons: [
          {
            id: 'les-41',
            title: '1. Designing Epic Environments from Blank Canvas',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 920,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-22'
  },
  {
    id: 'course-5',
    title: 'Cinematic Film Scoring, Audio Mixing & Sound Design',
    slug: 'cinematic-film-scoring-sound-design',
    subtitle: 'Compose evocative orchestral themes, craft atmospheric foley, and engineer punchy immersive mixes in Ableton Live.',
    description: 'Learn the craft of modern cinematic sound. Discover how Hans Zimmer and Ludwig Göransson blend analog synthesizers with orchestral arrangements, sculpt deep sub-bass impacts, and mix audio for maximum emotional power.',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3499,
    discountPrice: 699,
    status: 'PUBLISHED',
    level: 'ALL_LEVELS',
    language: 'English',
    categoryId: 'cat-5',
    categoryName: 'Music Production & Sound Engineering',
    subcategory: 'Cinematic Film Scoring',
    tags: ['Music Production', 'Film Scoring', 'Ableton', 'Sound Design', 'Audio Mixing'],
    instructorId: 'user-2',
    instructorName: 'Julian Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Film Composer & Grammy-Nominated Audio Producer',
    rating: 4.92,
    reviewCount: 1380,
    studentCount: 13800,
    whatYouWillLearn: [
      'Compose tension, emotional crescendos, and character leitmotifs',
      'Layer orchestral strings, brass, and hybrid analog synthesizers',
      'Record and process custom foley sound effects for action films',
      'Mix and master cinematic tracks to commercial broadcast loudness standards'
    ],
    prerequisites: ['Any Digital Audio Workstation (Ableton, Logic Pro, FL Studio, or Reaper)'],
    sections: [
      {
        id: 'sec-51',
        title: 'Section 1: Sonic Architecture & Melody',
        order: 1,
        lessons: [
          {
            id: 'les-51',
            title: '1. Crafting Memorable Themes & Chord Progressions',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 860,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-25'
  },
  {
    id: 'course-6',
    title: 'Creative Art Direction: Figma, Design Systems & Visual Identity',
    slug: 'creative-art-direction-figma-brand-systems',
    subtitle: 'Lead visual creative campaigns, build world-class brand identities, design systems, and aesthetic typography in Figma.',
    description: 'Master the high-level art of Creative Direction. Learn brand positioning, moodboarding, color psychology, layout typography grids, design tokens, and packaging presentation that wins client pitches.',
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 2799,
    discountPrice: 549,
    status: 'PUBLISHED',
    level: 'ALL_LEVELS',
    language: 'English',
    categoryId: 'cat-6',
    categoryName: 'UI/UX & Brand Creative Direction',
    subcategory: 'Creative Art Direction',
    tags: ['Design System', 'Figma', 'Creative Direction', 'Typography', 'Branding'],
    instructorId: 'user-2',
    instructorName: 'Sophia Al-Mansoor',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Award-Winning Creative Director & Brand Strategist',
    rating: 4.95,
    reviewCount: 1810,
    studentCount: 18100,
    whatYouWillLearn: [
      'Direct visual identities from conceptual moodboard to brand book',
      'Build scalable auto-layout components and dynamic variables in Figma',
      'Master editorial typography pairing, hierarchy, and micro-interactions',
      'Deliver multi-platform design systems for web, mobile, and print'
    ],
    prerequisites: ['Free Figma account'],
    sections: [
      {
        id: 'sec-61',
        title: 'Section 1: Art Direction Foundations',
        order: 1,
        lessons: [
          {
            id: 'les-61',
            title: '1. Developing Visual Taste & Moodboard Synthesis',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 750,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-26'
  },
  {
    id: 'course-7',
    title: 'Motion Graphics Mastery: After Effects & Cinema 4D',
    slug: 'motion-graphics-after-effects-cinema-4d',
    subtitle: 'Design seamless title sequences, kinetic typography, 3D brand stings, and high-energy commercial promo animations.',
    description: 'Bring static design to life. Learn kinetic speed graphs, 3D camera tracking, particle simulations, dynamic text reveals, and match-cuts for broadcast television and social media.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3199,
    discountPrice: 649,
    status: 'PUBLISHED',
    level: 'INTERMEDIATE',
    language: 'English',
    categoryId: 'cat-4',
    categoryName: '3D Animation & Motion Design',
    subcategory: 'After Effects Kinetic Type',
    tags: ['Motion Graphics', 'After Effects', 'Cinema 4D', 'Animation', 'Typography'],
    instructorId: 'user-2',
    instructorName: 'Kai Chen & Elena Rostova',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Senior Motion Designers',
    rating: 4.91,
    reviewCount: 1250,
    studentCount: 12500,
    whatYouWillLearn: [
      'Master the 12 Principles of Animation applied to modern motion design',
      'Create custom kinetic typography animations with easing speed curves',
      'Seamlessly integrate 3D Cinema 4D renders into After Effects comps',
      'Design broadcast-ready commercial stingers and lower thirds'
    ],
    prerequisites: ['Adobe After Effects installed'],
    sections: [
      {
        id: 'sec-71',
        title: 'Section 1: Kinetic Principles & Graph Editor',
        order: 1,
        lessons: [
          {
            id: 'les-71',
            title: '1. Mastering the Speed Graph for Snappy Motion',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 820,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-27'
  },
  {
    id: 'course-8',
    title: 'Commercial Video Production: From Script to Screen',
    slug: 'commercial-video-production-script-to-screen',
    subtitle: 'The complete blueprint to pitching, lighting, shooting on RED/Arri, directing talent, and delivering high-budget commercials.',
    description: 'Go behind the scenes of high-end commercial filmmaking. Learn how to write compelling treatments, build mood boards, choose cinema cameras, direct professional actors, and run an efficient commercial set.',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 3999,
    discountPrice: 899,
    status: 'PUBLISHED',
    level: 'ADVANCED',
    language: 'English',
    categoryId: 'cat-1',
    categoryName: 'Cinematography & Directing',
    subcategory: 'Commercial Directing',
    tags: ['Commercials', 'Directing', 'Production', 'Filmmaking', 'Cinematography'],
    instructorId: 'user-2',
    instructorName: 'Philip Bloom & Sophia Al-Mansoor',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Commercial Directors & Producers',
    rating: 4.99,
    reviewCount: 2890,
    studentCount: 28900,
    whatYouWillLearn: [
      'Write winning director treatments that secure commercial clients',
      'Manage crew hierarchy: Gaffer, Grip, AC, 1st AD & Sound Recordist',
      'Rig cinema camera packages with wireless video & follow focus',
      'Navigate client feedback and deliver multiple aspect-ratio cuts'
    ],
    prerequisites: ['Basic camera and video editing experience'],
    sections: [
      {
        id: 'sec-81',
        title: 'Section 1: Pre-Production & Pitching',
        order: 1,
        lessons: [
          {
            id: 'les-81',
            title: '1. Writing Treatments & Building Cinematic Storyboards',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 940,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-28'
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    courseId: 'course-1',
    userId: 'user-1',
    userName: 'Maya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    rating: 5,
    comment: 'Philip Bloom’s breakdown of lens focal lengths and spatial compression completely revolutionized how I shoot my documentary projects!',
    createdAt: '2026-02-02'
  },
  {
    id: 'rev-2',
    courseId: 'course-2',
    userId: 'user-1',
    userName: 'Maya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    rating: 5,
    comment: 'The ACES color science workflow and skin tone balancing in DaVinci Resolve is world-class. Worth 10x the price.',
    createdAt: '2026-02-16'
  }
];

export const MOCK_QA: LessonQA[] = [
  {
    id: 'qa-1',
    lessonId: 'les-1',
    userId: 'user-1',
    userName: 'Maya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    isInstructor: false,
    question: 'When shooting in 4K, do you recommend natural diffusion filters (e.g. 1/8 Black Pro-Mist) on digital sensors?',
    createdAt: '2026-02-03',
    replies: [
      {
        id: 'reply-1',
        userId: 'user-2',
        userName: 'Philip Bloom',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        isInstructor: true,
        answer: 'Hi Maya! Absolutely. Modern digital sensors are ultra-sharp. A subtle 1/8 Black Pro-Mist softens digital harshness and blooms highlights with authentic film warmth.',
        createdAt: '2026-02-03'
      }
    ]
  }
];

export const MOCK_ORDERS: Order[] = [];
export const MOCK_CERTIFICATES: Certificate[] = [];
