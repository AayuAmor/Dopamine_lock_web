export const missions = [
  {
    id: 1,
    name: 'Deep Work: DSA Blocks',
    goal: 'Complete graph traversal drills',
    duration: '90 min',
    difficulty: 'Hard',
    progress: 68,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Project Build Sprint',
    goal: 'Ship dashboard shell',
    duration: '120 min',
    difficulty: 'Medium',
    progress: 100,
    status: 'Completed',
  },
  {
    id: 3,
    name: 'Reading Lock',
    goal: 'Read 30 pages without phone checks',
    duration: '45 min',
    difficulty: 'Easy',
    progress: 40,
    status: 'Template',
  },
]

export const sessions = [
  {
    id: 1,
    date: 'Today',
    title: 'Deep Work: DSA Blocks',
    status: 'Completed',
    duration: '92 min',
    time: '08:00 - 09:32',
    xp: 140,
  },
  {
    id: 2,
    date: 'Today',
    title: 'Reading Lock',
    status: 'Failed',
    duration: '18 min',
    time: '12:10 - 12:28',
    xp: 0,
  },
  {
    id: 3,
    date: 'Yesterday',
    title: 'Project Build Sprint',
    status: 'Completed',
    duration: '121 min',
    time: '20:00 - 22:01',
    xp: 180,
  },
  {
    id: 4,
    date: 'Monday',
    title: 'Inbox Zero Discipline',
    status: 'Completed',
    duration: '35 min',
    time: '10:00 - 10:35',
    xp: 60,
  },
]

export const blockedWebsites = [
  { id: 1, site: 'youtube.com', category: 'Video' },
  { id: 2, site: 'x.com', category: 'Social' },
  { id: 3, site: 'reddit.com', category: 'Forums' },
  { id: 4, site: 'instagram.com', category: 'Social' },
]

export const allowedWebsites = [
  { id: 1, site: 'leetcode.com', category: 'DSA' },
  { id: 2, site: 'github.com', category: 'Build' },
  { id: 3, site: 'docs.python.org', category: 'Docs' },
]

export const goals = [
  { id: 1, title: 'Master DSA', progress: 64, missions: 18 },
  { id: 2, title: 'Build Projects', progress: 48, missions: 12 },
  { id: 3, title: 'Read 12 Books', progress: 35, missions: 9 },
  { id: 4, title: 'Improve Consistency', progress: 76, missions: 24 },
  { id: 5, title: 'Reduce Instagram Reels', progress: 58, missions: 7 },
  { id: 6, title: 'Reduce Shorts', progress: 62, missions: 8 },
  { id: 7, title: 'Digital Detox', progress: 41, missions: 5 },
  { id: 8, title: 'Less than 30 reels/day', progress: 73, missions: 11 },
]

export const achievements = [
  { id: 1, title: 'First Mission', state: 'Unlocked', progress: 100 },
  { id: 2, title: '7 Day Streak', state: 'Unlocked', progress: 100 },
  { id: 3, title: 'Focus Warrior', state: 'Progress', progress: 72 },
  { id: 4, title: 'Deep Work Beast', state: 'Progress', progress: 44 },
  { id: 5, title: 'Discipline Master', state: 'Locked', progress: 12 },
]

export const analytics = {
  focusHours: [2, 3.5, 1.5, 4, 2.5, 5, 3],
  scoreTrend: [62, 65, 69, 68, 72, 76, 81],
  weeklyReels: [34, 28, 23, 31, 19, 26, 22],
  weeklyShorts: [21, 24, 18, 22, 16, 19, 15],
  consumptionTrend: [74, 68, 59, 71, 52, 63, 49],
  platformBreakdown: [42, 31, 18, 9],
  successRate: 86,
  blocksPrevented: 247,
  timeSaved: '18.4h',
  weeklyAverage: '3.1h',
  bestDay: 'Saturday',
  totalSessions: 124,
}

export const streakDays = [
  'completed', 'completed', 'partial', 'completed', 'missed', 'completed', 'today',
  'completed', 'completed', 'completed', 'partial', 'completed', 'completed', 'missed',
  'completed', 'completed', 'completed', 'completed', 'partial', 'completed', 'completed',
  'completed', 'missed', 'completed', 'completed', 'completed', 'today', 'partial',
  'completed', 'completed', 'missed', 'completed', 'completed', 'partial', 'completed',
]

export const disciplineScore = {
  score: 812,
  rank: 'Operator III',
  xp: 68,
  breakdown: [
    { label: 'Mission completion', value: 84 },
    { label: 'Streak stability', value: 76 },
    { label: 'Impulse control', value: 91 },
    { label: 'Deep work volume', value: 69 },
    { label: 'Consumption control', value: 82 },
  ],
  categories: [
    { label: 'Mission Completion', value: '+420 XP' },
    { label: 'Focus Hours', value: '+180 XP' },
    { label: 'Streak', value: '+210 XP' },
    { label: 'Distraction Resistance', value: '+90 XP' },
    { label: 'Healthy Consumption', value: '+75 XP' },
    { label: 'Failed Missions', value: '-18 XP', danger: true },
  ],
  ladder: ['Recruit', 'Builder', 'Operator I', 'Operator II', 'Operator III', 'Master'],
}

export const consumptionControl = {
  score: 82,
  status: 'Healthy Consumption',
  today: {
    reels: 23,
    shorts: 18,
    timeConsumed: '1h 42m',
    limitRemaining: '17 Videos',
    healthyPercent: 82,
  },
  platforms: [
    {
      id: 1,
      name: 'YouTube Shorts',
      videos: 18,
      minutes: 34,
      limit: 40,
      progress: 45,
      status: 'Healthy',
    },
    {
      id: 2,
      name: 'Instagram Reels',
      videos: 23,
      minutes: 47,
      limit: 30,
      progress: 77,
      status: 'Warning',
    },
    {
      id: 3,
      name: 'TikTok',
      videos: 12,
      minutes: 18,
      limit: 20,
      progress: 60,
      status: 'Healthy',
    },
    {
      id: 4,
      name: 'Facebook Reels',
      videos: 10,
      minutes: 13,
      limit: 10,
      progress: 100,
      status: 'Limit Reached',
    },
  ],
  timeline: [
    { day: 'Monday', total: 55 },
    { day: 'Tuesday', total: 48 },
    { day: 'Wednesday', total: 41 },
    { day: 'Thursday', total: 53 },
    { day: 'Friday', total: 35 },
    { day: 'Saturday', total: 45 },
    { day: 'Sunday', total: 33 },
  ],
  limits: {
    reels: 30,
    shorts: 40,
    tiktok: 20,
    watchTime: 120,
  },
  weekly: {
    averageDailyConsumption: '49 videos',
    videosAvoided: 136,
    estimatedTimeSaved: '7h 20m',
    focusHoursGained: '5.4h',
  },
  identityStats: {
    healthyDays: 19,
    videosAvoided: 432,
    timeSaved: '28h',
    rating: 'A-',
  },
}

export const futureFeatures = [
  'GitHub Integration',
  'DevGraph Integration',
  'Developer Focus Missions',
  'Coding Session Weight',
  'AI Focus Coach',
  'Organization Dashboard',
]

export const weeklyReview = {
  range: 'Jun 22 - Jun 28',
  focusHours: '21.6h',
  sessions: 16,
  completed: 14,
  failed: 2,
  bestDay: 'Wednesday',
  worstDay: 'Friday',
  consistency: '88%',
  summary: 'Your week was defined by clean starts and strong recovery after failed sessions.',
}

export const monthlyReview = {
  focusHours: '86.4h',
  sessions: 58,
  successRate: '84%',
  scoreGained: '+126',
  rankProgress: 68,
}
