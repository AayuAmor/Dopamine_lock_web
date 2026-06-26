const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const presetBlockLists = [
  {
    name: 'Social Media Detox',
    description: 'Block high-frequency social platforms during discipline windows.',
    category: 'SOCIAL_MEDIA',
    websites: ['instagram.com', 'facebook.com', 'twitter.com', 'x.com', 'tiktok.com', 'snapchat.com'],
  },
  {
    name: 'Entertainment Lock',
    description: 'Remove streaming and entertainment loops while focused.',
    category: 'ENTERTAINMENT',
    websites: ['youtube.com', 'netflix.com', 'primevideo.com', 'disneyplus.com', 'twitch.tv'],
  },
  {
    name: 'Gaming Lock',
    description: 'Restrict common gaming sites and launchers.',
    category: 'GAMING',
    websites: ['roblox.com', 'epicgames.com', 'steampowered.com', 'chess.com'],
  },
  {
    name: 'Shopping Control',
    description: 'Block shopping sites that trigger browsing loops.',
    category: 'SHOPPING',
    websites: ['amazon.com', 'ebay.com', 'daraz.com', 'aliexpress.com'],
  },
  {
    name: 'News Fast',
    description: 'Reduce news and feed checking during mission hours.',
    category: 'NEWS',
    websites: ['reddit.com', 'cnn.com', 'bbc.com', 'nytimes.com'],
  },
]

const consumptionPlatforms = [
  {
    category: 'SHORT_FORM',
    domain: 'youtube.com/shorts',
    name: 'YouTube Shorts',
    slug: 'youtube-shorts',
  },
  {
    category: 'SHORT_FORM',
    domain: 'instagram.com/reels',
    name: 'Instagram Reels',
    slug: 'instagram-reels',
  },
  {
    category: 'SHORT_FORM',
    domain: 'tiktok.com',
    name: 'TikTok',
    slug: 'tiktok',
  },
  {
    category: 'SHORT_FORM',
    domain: 'facebook.com/reels',
    name: 'Facebook Reels',
    slug: 'facebook-reels',
  },
]

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
    })
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
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
