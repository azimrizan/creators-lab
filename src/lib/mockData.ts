import { Course, Category, User, Review, Order, Certificate, LessonQA } from './types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Web Development',
    slug: 'web-development',
    icon: 'Code2',
    subcategories: ['React & Next.js', 'Node.js', 'Full Stack', 'Tailwind CSS']
  },
  {
    id: 'cat-2',
    name: 'Python & Data Science',
    slug: 'python-data-science',
    icon: 'Brain',
    subcategories: ['Python Basics', 'Machine Learning', 'Data Analysis', 'Deep Learning']
  },
  {
    id: 'cat-3',
    name: 'UI/UX & Product Design',
    slug: 'ui-ux-design',
    icon: 'Palette',
    subcategories: ['Figma Mastery', 'User Research', 'Design Systems', 'Prototyping']
  },
  {
    id: 'cat-4',
    name: 'Cloud & DevOps',
    slug: 'cloud-devops',
    icon: 'Cloud',
    subcategories: ['AWS Fundamentals', 'Docker & Kubernetes', 'CI/CD Pipelines']
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Maya Sharma',
    email: 'student@learnhub.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    isBlocked: false,
    enrolledCourseIds: [],
    wishlistCourseIds: [],
    createdAt: '2026-01-15'
  },
  {
    id: 'user-2',
    name: 'Dr. Rahul Verma',
    email: 'instructor@learnhub.com',
    role: 'INSTRUCTOR',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    bio: 'Senior Full Stack Engineer & Educator with 10+ years experience training over 50,000 developers worldwide.',
    isBlocked: false,
    enrolledCourseIds: [],
    wishlistCourseIds: [],
    createdAt: '2025-06-10'
  },
  {
    id: 'user-3',
    name: 'Super Admin',
    email: 'admin@learnhub.com',
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
    title: 'Full-Stack Next.js 14 & React Masterclass 2026',
    slug: 'full-stack-nextjs-react-masterclass',
    subtitle: 'Build production-ready web apps with App Router, TypeScript, Prisma, MongoDB & Tailwind CSS from absolute zero to deployment.',
    description: 'Master modern full-stack web development with Next.js 14+. In this comprehensive bootcamp, you will build 4 real-world projects including a SaaS platform, an e-commerce shop, and an AI dashboard.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    price: 3499,
    discountPrice: 699,
    status: 'PUBLISHED',
    level: 'BEGINNER',
    language: 'English',
    categoryId: 'cat-1',
    categoryName: 'Web Development',
    subcategory: 'React & Next.js',
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'MongoDB'],
    instructorId: 'user-2',
    instructorName: 'Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Senior Full-Stack Engineer & Author',
    rating: 4.9,
    reviewCount: 1420,
    studentCount: 18450,
    whatYouWillLearn: [
      'Master Next.js 14 App Router, Server Components & Server Actions',
      'Build scalable backend API routes with TypeScript & MongoDB',
      'Integrate Razorpay & Stripe payment gateways with Webhooks',
      'Implement authentication with NextAuth.js and RBAC route guards',
      'Deploy full-stack applications on Vercel with custom domain & SSL'
    ],
    prerequisites: [
      'Basic knowledge of JavaScript (ES6+)',
      'A computer running Windows, macOS, or Linux'
    ],
    sections: [
      {
        id: 'sec-1',
        title: 'Section 1: Course Foundations & Architecture',
        order: 1,
        lessons: [
          {
            id: 'les-1',
            title: '1. Welcome & High-Level Platform Overview',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 420,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            isFreePreview: true
          },
          {
            id: 'les-2',
            title: '2. Setting Up Next.js 14 App Router with TypeScript',
            order: 2,
            contentType: 'VIDEO',
            durationSeconds: 780,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            isFreePreview: true
          },
          {
            id: 'les-3',
            title: '3. Architecture PDF CheatSheet & Setup Guide',
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
        title: 'Section 2: Database Modeling with MongoDB & Mongoose',
        order: 2,
        lessons: [
          {
            id: 'les-4',
            title: '4. MongoDB Atlas Setup & Connection Pooling',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 940,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            isFreePreview: false
          },
          {
            id: 'les-5',
            title: '5. Knowledge Check: Database & Mongoose Quiz',
            order: 2,
            contentType: 'QUIZ',
            durationSeconds: 600,
            videoUrl: '',
            isFreePreview: false,
            quiz: {
              id: 'quiz-1',
              title: 'MongoDB & Database Modeling Assessment',
              passingScorePercent: 70,
              timeLimitMinutes: 10,
              questions: [
                {
                  id: 'q1',
                  question: 'What is the primary advantage of using Mongoose ODM in Next.js applications?',
                  options: [
                    'It provides schema validation and type safety for MongoDB documents',
                    'It replaces SQL database engines with Redis',
                    'It automatically converts HTML to PDF',
                    'It compiles JavaScript into C++ binary code'
                  ],
                  correctOptionIndex: 0,
                  explanation: 'Mongoose provides strongly typed schema validation, hooks, and model methods for MongoDB documents.'
                },
                {
                  id: 'q2',
                  question: 'Which HTTP method should be used for state-changing API endpoints?',
                  options: ['GET', 'POST / PUT / DELETE', 'OPTIONS', 'HEAD'],
                  correctOptionIndex: 1,
                  explanation: 'State-changing operations must use POST, PUT, PATCH, or DELETE to adhere to standard REST patterns.'
                }
              ]
            }
          }
        ]
      }
    ],
    updatedAt: '2026-02-01'
  },
  {
    id: 'course-2',
    title: 'Introduction to Visual Storytelling',
    slug: 'introduction-to-visual-storytelling',
    subtitle: 'Master framing, Rule of Thirds, lens choices, depth of field & composition techniques with legendary filmmaker Philip Bloom.',
    description: 'Learn the foundational principles of visual storytelling from acclaimed cinematographer Philip Bloom. Discover how to arrange subjects within the frame, harness lens compression, control lighting contrast, and tell immersive stories through camera language.',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
    price: 2999,
    discountPrice: 499,
    status: 'PUBLISHED',
    level: 'BEGINNER',
    language: 'English',
    categoryId: 'cat-3',
    categoryName: 'UI/UX & Product Design',
    subcategory: 'Visual Arts & Composition',
    tags: ['Visual Storytelling', 'Cinematography', 'Filmmaking', 'Rule of Thirds', 'Composition'],
    instructorId: 'user-2',
    instructorName: 'Philip Bloom & Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Master Cinematographer & Educator',
    rating: 4.9,
    reviewCount: 1850,
    studentCount: 15400,
    whatYouWillLearn: [
      'Master composition techniques and the Rule of Thirds grid',
      'Understand framing styles: One-point perspective, Central framing & Lead space',
      'Choose the right lens focal lengths (10mm to 400mm) and handle lens compression',
      'Eliminate facial distortion using natural 50mm–90mm portrait range lenses',
      'Utilize shallow depth of field, contrast, and light to direct viewer attention'
    ],
    prerequisites: ['No prior filmmaking or camera experience required'],
    sections: [
      {
        id: 'sec-21',
        title: 'Section 1: Visual Storytelling Foundations & Camera Language',
        order: 1,
        lessons: [
          {
            id: 'les-21',
            title: '1. Visual Storytelling 101: Composition, Lenses & Framing',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 815,
            videoUrl: '/vidssave.com Visual Storytelling 101 480P.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-14'
  },
  {
    id: 'course-3',
    title: 'Figma to Code: UI/UX Design & Design Systems',
    slug: 'figma-to-code-ui-ux-design',
    subtitle: 'Design beautiful, highly accessible web interfaces, build reusable design tokens, and handoff seamlessly to developers.',
    description: 'Learn modern UI/UX design in Figma. Create auto-layout components, color palettes, dark mode designs, and interactive micro-animations.',
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    price: 2499,
    discountPrice: 599,
    status: 'PUBLISHED',
    level: 'ALL_LEVELS',
    language: 'English',
    categoryId: 'cat-3',
    categoryName: 'UI/UX & Product Design',
    subcategory: 'Figma Mastery',
    tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
    instructorId: 'user-2',
    instructorName: 'Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Product Design Director',
    rating: 4.9,
    reviewCount: 650,
    studentCount: 8400,
    whatYouWillLearn: [
      'Master Figma Auto Layout 5.0 and Component Variants',
      'Create dynamic design tokens and variables for dark/light themes',
      'Conduct user research and usability testing sessions'
    ],
    prerequisites: ['Free Figma account'],
    sections: [
      {
        id: 'sec-31',
        title: 'Section 1: Figma Fundamentals',
        order: 1,
        lessons: [
          {
            id: 'les-31',
            title: '1. Figma UI Overview & Canvas Tools',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 620,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-05'
  },
  {
    id: 'course-4',
    title: 'Python for AI, Deep Learning & LLM Systems',
    slug: 'python-ai-deep-learning-llms',
    subtitle: 'Build autonomous AI agents, fine-tune neural models, and deploy production machine learning pipelines.',
    description: 'A comprehensive journey into modern Artificial Intelligence. Learn Python data science libraries, PyTorch neural networks, embeddings, vector databases, and RAG architectures.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    price: 3999,
    discountPrice: 799,
    status: 'PUBLISHED',
    level: 'INTERMEDIATE',
    language: 'English',
    categoryId: 'cat-2',
    categoryName: 'Python & Data Science',
    subcategory: 'Machine Learning',
    tags: ['Python', 'AI', 'PyTorch', 'Machine Learning', 'LLMs'],
    instructorId: 'user-2',
    instructorName: 'Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'AI Research Scientist & Author',
    rating: 4.95,
    reviewCount: 2130,
    studentCount: 22800,
    whatYouWillLearn: [
      'Build generative AI apps with LangChain, LlamaIndex, and Vector DBs',
      'Train Convolutional and Recurrent neural networks with PyTorch',
      'Fine-tune open source LLMs on custom dataset formats',
      'Deploy AI model endpoints with FastAPI and Docker'
    ],
    prerequisites: ['Basic programming fundamentals'],
    sections: [
      {
        id: 'sec-41',
        title: 'Section 1: AI & Neural Network Foundations',
        order: 1,
        lessons: [
          {
            id: 'les-41',
            title: '1. Introduction to Modern AI & Python Ecosystem',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 720,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-18'
  },
  {
    id: 'course-5',
    title: 'Cloud DevOps Masterclass: AWS, Docker & Kubernetes',
    slug: 'cloud-devops-masterclass-aws-docker-kubernetes',
    subtitle: 'Architect resilient cloud infrastructure, automate CI/CD pipelines, and manage microservices clusters at scale.',
    description: 'Learn enterprise DevOps practices from scratch. Master Linux server management, Docker containerization, Kubernetes orchestration, Terraform Infrastructure as Code, and GitHub Actions CI/CD.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    price: 3499,
    discountPrice: 749,
    status: 'PUBLISHED',
    level: 'ADVANCED',
    language: 'English',
    categoryId: 'cat-4',
    categoryName: 'Cloud & DevOps',
    subcategory: 'Docker & Kubernetes',
    tags: ['DevOps', 'AWS', 'Kubernetes', 'Docker', 'CI/CD'],
    instructorId: 'user-2',
    instructorName: 'Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Principal Cloud Architect',
    rating: 4.88,
    reviewCount: 940,
    studentCount: 11200,
    whatYouWillLearn: [
      'Design fault-tolerant multi-region VPC architectures on AWS',
      'Containerize fullstack applications with multi-stage Dockerfiles',
      'Deploy and scale Kubernetes deployments with Helm charts',
      'Automate continuous deployment with GitHub Actions & ArgoCD'
    ],
    prerequisites: ['Basic Linux command line knowledge'],
    sections: [
      {
        id: 'sec-51',
        title: 'Section 1: Containerization Fundamentals',
        order: 1,
        lessons: [
          {
            id: 'les-51',
            title: '1. Docker Architecture & Container Lifecycle',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 850,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-20'
  },
  {
    id: 'course-6',
    title: 'Cybersecurity & Ethical Hacking Defense 2026',
    slug: 'cybersecurity-ethical-hacking-defense',
    subtitle: 'Learn penetration testing, network defense, threat modeling, and web application security auditing.',
    description: 'Comprehensive cybersecurity training covering OWASP Top 10 vulnerabilities, Kali Linux security tools, packet analysis with Wireshark, cryptography, and real-world ethical penetration testing.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    price: 3299,
    discountPrice: 649,
    status: 'PUBLISHED',
    level: 'BEGINNER',
    language: 'English',
    categoryId: 'cat-1',
    categoryName: 'Web Development',
    subcategory: 'Full Stack',
    tags: ['Security', 'Ethical Hacking', 'OWASP', 'Linux', 'Network'],
    instructorId: 'user-2',
    instructorName: 'Dr. Rahul Verma',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    instructorTitle: 'Certified Ethical Hacker (CEH)',
    rating: 4.92,
    reviewCount: 1680,
    studentCount: 14750,
    whatYouWillLearn: [
      'Audit web applications for OWASP Top 10 vulnerabilities',
      'Perform network reconnaissance and vulnerability scanning',
      'Implement JWT, OAuth2, and zero-trust security architecture',
      'Conduct authorized penetration testing and bug bounty reporting'
    ],
    prerequisites: ['Basic networking and HTTP protocol concepts'],
    sections: [
      {
        id: 'sec-61',
        title: 'Section 1: Security Fundamentals & Reconnaissance',
        order: 1,
        lessons: [
          {
            id: 'les-61',
            title: '1. Web App Security Architecture & Attack Vectors',
            order: 1,
            contentType: 'VIDEO',
            durationSeconds: 680,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            isFreePreview: true
          }
        ]
      }
    ],
    updatedAt: '2026-02-22'
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
    comment: 'Hands down the best Next.js course on the internet! The breakdown of App Router, Server Actions, and MongoDB modeling was crystal clear.',
    createdAt: '2026-02-02'
  }
];

export const MOCK_QA: LessonQA[] = [
  {
    id: 'qa-1',
    lessonId: 'les-2',
    userId: 'user-1',
    userName: 'Maya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    isInstructor: false,
    question: 'How do we configure Environment variables safely in Next.js Server Actions?',
    createdAt: '2026-02-03',
    replies: [
      {
        id: 'reply-1',
        userId: 'user-2',
        userName: 'Dr. Rahul Verma',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        isInstructor: true,
        answer: 'Hi Maya! Environment variables without the NEXT_PUBLIC_ prefix remain strictly server-side and are never exposed to the client bundle.',
        createdAt: '2026-02-03'
      }
    ]
  }
];

export const MOCK_ORDERS: Order[] = [];
export const MOCK_CERTIFICATES: Certificate[] = [];
