const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const achievements = [
  // MISSION
  {
    code: "FIRST_MISSION",
    category: "MISSION",
    rarity: "COMMON",
    xpReward: 25,
    icon: "target",
    title: "First Mission",
    description: "Complete your very first mission.",
  },
  {
    code: "MISSION_STARTER",
    category: "MISSION",
    rarity: "COMMON",
    xpReward: 50,
    icon: "target",
    title: "Mission Starter",
    description: "Complete 10 missions.",
  },
  {
    code: "MISSION_EXPERT",
    category: "MISSION",
    rarity: "RARE",
    xpReward: 150,
    icon: "target",
    title: "Mission Expert",
    description: "Complete 100 missions.",
  },
  // STREAK
  {
    code: "STREAK_7",
    category: "STREAK",
    rarity: "COMMON",
    xpReward: 50,
    icon: "flame",
    title: "7-Day Streak",
    description: "Maintain a 7-day streak.",
  },
  {
    code: "STREAK_14",
    category: "STREAK",
    rarity: "UNCOMMON",
    xpReward: 75,
    icon: "flame",
    title: "14-Day Streak",
    description: "Maintain a 14-day streak.",
  },
  {
    code: "STREAK_30",
    category: "STREAK",
    rarity: "RARE",
    xpReward: 150,
    icon: "flame",
    title: "30-Day Streak",
    description: "Maintain a 30-day streak.",
  },
  {
    code: "STREAK_60",
    category: "STREAK",
    rarity: "EPIC",
    xpReward: 300,
    icon: "flame",
    title: "60-Day Streak",
    description: "Maintain a 60-day streak.",
  },
  {
    code: "STREAK_100",
    category: "STREAK",
    rarity: "LEGENDARY",
    xpReward: 500,
    icon: "flame",
    title: "100-Day Streak",
    description: "Maintain a 100-day streak.",
  },
  // FOCUS
  {
    code: "FOCUS_10H",
    category: "FOCUS",
    rarity: "COMMON",
    xpReward: 25,
    icon: "clock",
    title: "10 Focus Hours",
    description: "Accumulate 10 hours of total focus time.",
  },
  {
    code: "FOCUS_25H",
    category: "FOCUS",
    rarity: "UNCOMMON",
    xpReward: 50,
    icon: "clock",
    title: "25 Focus Hours",
    description: "Accumulate 25 hours of total focus time.",
  },
  {
    code: "FOCUS_50H",
    category: "FOCUS",
    rarity: "RARE",
    xpReward: 100,
    icon: "clock",
    title: "50 Focus Hours",
    description: "Accumulate 50 hours of total focus time.",
  },
  {
    code: "FOCUS_100H",
    category: "FOCUS",
    rarity: "EPIC",
    xpReward: 200,
    icon: "clock",
    title: "100 Focus Hours",
    description: "Accumulate 100 hours of total focus time.",
  },
  {
    code: "FOCUS_250H",
    category: "FOCUS",
    rarity: "LEGENDARY",
    xpReward: 500,
    icon: "clock",
    title: "250 Focus Hours",
    description: "Accumulate 250 hours of total focus time.",
  },
  // DISCIPLINE
  {
    code: "RANK_C",
    category: "DISCIPLINE",
    rarity: "COMMON",
    xpReward: 30,
    icon: "gauge",
    title: "Rank C",
    description: "Reach Rank C in discipline score.",
  },
  {
    code: "RANK_B",
    category: "DISCIPLINE",
    rarity: "UNCOMMON",
    xpReward: 60,
    icon: "gauge",
    title: "Rank B",
    description: "Reach Rank B in discipline score.",
  },
  {
    code: "RANK_A",
    category: "DISCIPLINE",
    rarity: "RARE",
    xpReward: 100,
    icon: "gauge",
    title: "Rank A",
    description: "Reach Rank A in discipline score.",
  },
  {
    code: "RANK_S",
    category: "DISCIPLINE",
    rarity: "EPIC",
    xpReward: 200,
    icon: "gauge",
    title: "Rank S",
    description: "Reach Rank S in discipline score.",
  },
  {
    code: "RANK_S_PLUS",
    category: "DISCIPLINE",
    rarity: "LEGENDARY",
    xpReward: 500,
    icon: "gauge",
    title: "Rank S+",
    description: "Reach the legendary Rank S+ in discipline score.",
  },
  // GOALS
  {
    code: "FIRST_GOAL",
    category: "GOALS",
    rarity: "COMMON",
    xpReward: 25,
    icon: "check-circle",
    title: "First Goal Completed",
    description: "Complete your first goal.",
  },
  {
    code: "GOALS_5",
    category: "GOALS",
    rarity: "UNCOMMON",
    xpReward: 75,
    icon: "check-circle",
    title: "Goal Achiever",
    description: "Complete 5 goals.",
  },
  {
    code: "GOALS_20",
    category: "GOALS",
    rarity: "EPIC",
    xpReward: 200,
    icon: "check-circle",
    title: "Goal Master",
    description: "Complete 20 goals.",
  },
  // DIGITAL_WELLNESS
  {
    code: "FIRST_DETOX",
    category: "DIGITAL_WELLNESS",
    rarity: "UNCOMMON",
    xpReward: 50,
    icon: "shield",
    title: "Digital Detox",
    description: "Complete a digital detox goal.",
  },
  {
    code: "HEALTHY_WEEK",
    category: "DIGITAL_WELLNESS",
    rarity: "UNCOMMON",
    xpReward: 75,
    icon: "shield",
    title: "Healthy Week",
    description: "Maintain healthy consumption for 7 consecutive days.",
  },
  {
    code: "NO_LIMIT_30",
    category: "DIGITAL_WELLNESS",
    rarity: "RARE",
    xpReward: 150,
    icon: "shield",
    title: "Limit-Free Month",
    description: "Go 30 days without hitting a consumption limit.",
  },
  // SPECIAL
  {
    code: "PERFECT_WEEK",
    category: "SPECIAL",
    rarity: "RARE",
    xpReward: 100,
    icon: "star",
    title: "Perfect Week",
    description: "Complete at least 5 missions with no abandons in a week.",
  },
  {
    code: "NO_ABANDON_30",
    category: "SPECIAL",
    rarity: "EPIC",
    xpReward: 150,
    icon: "shield-check",
    title: "No Quit Month",
    description: "Zero abandoned missions in the last 30 days.",
  },
  {
    code: "FOCUS_WARRIOR",
    category: "SPECIAL",
    rarity: "EPIC",
    xpReward: 200,
    icon: "zap",
    title: "Focus Warrior",
    description: "Complete 50 missions and accumulate 50 hours of focus.",
  },
  {
    code: "DEEP_WORK_BEAST",
    category: "SPECIAL",
    rarity: "EPIC",
    xpReward: 200,
    icon: "brain",
    title: "Deep Work Beast",
    description: "Complete 25 missions with an average session of 90+ minutes.",
  },
  {
    code: "DISCIPLINED_BUILDER",
    category: "SPECIAL",
    rarity: "EPIC",
    xpReward: 150,
    icon: "trophy",
    title: "Disciplined Builder",
    description: "Complete 25 missions and achieve at least Rank B.",
  },
  {
    code: "DIGITAL_MINIMALIST",
    category: "SPECIAL",
    rarity: "EPIC",
    xpReward: 200,
    icon: "leaf",
    title: "Digital Minimalist",
    description:
      "Go 30 days without hitting a limit and complete a digital detox goal.",
  },
];

const presetBlockLists = [
  {
    name: "Social Media Detox",
    description:
      "Block high-frequency social platforms during discipline windows.",
    category: "SOCIAL_MEDIA",
    websites: [
      "instagram.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "tiktok.com",
      "snapchat.com",
    ],
  },
  {
    name: "Entertainment Lock",
    description: "Remove streaming and entertainment loops while focused.",
    category: "ENTERTAINMENT",
    websites: [
      "youtube.com",
      "netflix.com",
      "primevideo.com",
      "disneyplus.com",
      "twitch.tv",
    ],
  },
  {
    name: "Gaming Lock",
    description: "Restrict common gaming sites and launchers.",
    category: "GAMING",
    websites: ["roblox.com", "epicgames.com", "steampowered.com", "chess.com"],
  },
  {
    name: "Shopping Control",
    description: "Block shopping sites that trigger browsing loops.",
    category: "SHOPPING",
    websites: ["amazon.com", "ebay.com", "daraz.com", "aliexpress.com"],
  },
  {
    name: "News Fast",
    description: "Reduce news and feed checking during mission hours.",
    category: "NEWS",
    websites: ["reddit.com", "cnn.com", "bbc.com", "nytimes.com"],
  },
];

const consumptionPlatforms = [
  {
    category: "SHORT_FORM",
    domain: "youtube.com/shorts",
    name: "YouTube Shorts",
    slug: "youtube-shorts",
  },
  {
    category: "SHORT_FORM",
    domain: "instagram.com/reels",
    name: "Instagram Reels",
    slug: "instagram-reels",
  },
  {
    category: "SHORT_FORM",
    domain: "tiktok.com",
    name: "TikTok",
    slug: "tiktok",
  },
  {
    category: "SHORT_FORM",
    domain: "facebook.com/reels",
    name: "Facebook Reels",
    slug: "facebook-reels",
  },
];

async function main() {
  for (const preset of presetBlockLists) {
    await prisma.presetBlockList.upsert({
      where: { name: preset.name },
      update: {
        active: true,
        category: preset.category,
        description: preset.description,
        websites: preset.websites,
      },
      create: {
        ...preset,
        active: true,
      },
    });
  }

  for (const platform of consumptionPlatforms) {
    await prisma.consumptionPlatform.upsert({
      where: { slug: platform.slug },
      update: {
        active: true,
        category: platform.category,
        domain: platform.domain,
        name: platform.name,
      },
      create: {
        ...platform,
        active: true,
      },
    });
  }

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rarity: achievement.rarity,
        xpReward: achievement.xpReward,
      },
      create: achievement,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
