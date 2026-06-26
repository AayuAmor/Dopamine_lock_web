export const goals = [
  { id: 1, title: 'Master DSA', progress: 64 },
  { id: 2, title: 'Build Projects', progress: 48 },
  { id: 3, title: 'Read 12 Books', progress: 35 },
  { id: 4, title: 'Improve Consistency', progress: 76 },
  { id: 5, title: 'Reduce Instagram Reels', progress: 58 },
  { id: 6, title: 'Reduce Shorts', progress: 62 },
  { id: 7, title: 'Digital Detox', progress: 41 },
  { id: 8, title: 'Less than 30 reels/day', progress: 73 },
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
