import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create SMS packages
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { id: 'starter' },
      update: {},
      create: {
        id: 'starter',
        name: 'Starter',
        nameEn: 'Starter Package',
        nameBn: 'স্টার্টার প্যাকেজ',
        description: 'Perfect for small businesses and startups',
        descriptionEn: 'Perfect for small businesses and startups getting started with SMS marketing',
        descriptionBn: 'এসএমএস মার্কেটিং শুরু করা ছোট ব্যবসা এবং স্টার্টআপের জন্য নিখুঁত',
        price: 500,
        smsCount: 1000,
        validityDays: 30,
        features: {
          api_access: 'basic',
          support: 'email',
          delivery: 'standard',
          reporting: 'basic',
          sender_id: false,
          analytics: false
        },
        isActive: true
      }
    }),

    prisma.package.upsert({
      where: { id: 'business' },
      update: {},
      create: {
        id: 'business',
        name: 'Business',
        nameEn: 'Business Package',
        nameBn: 'ব্যবসা প্যাকেজ',
        description: 'Ideal for growing businesses with higher volume needs',
        descriptionEn: 'Ideal for growing businesses with higher volume needs and advanced features',
        descriptionBn: 'উচ্চ ভলিউম প্রয়োজন এবং উন্নত বৈশিষ্ট্য সহ ক্রমবর্ধমান ব্যবসার জন্য আদর্শ',
        price: 2000,
        smsCount: 5000,
        validityDays: 60,
        features: {
          api_access: 'advanced',
          support: 'priority_email',
          delivery: 'fast',
          reporting: 'detailed',
          sender_id: true,
          analytics: true,
          scheduling: true
        },
        isActive: true
      }
    }),

    prisma.package.upsert({
      where: { id: 'enterprise' },
      update: {},
      create: {
        id: 'enterprise',
        name: 'Corporate',
        nameEn: 'Corporate Package',
        nameBn: 'কর্পোরেট প্যাকেজ',
        description: 'Complete solution for large organizations',
        descriptionEn: 'Complete SMS solution for large organizations with premium support',
        descriptionBn: 'প্রিমিয়াম সাপোর্ট সহ বড় সংস্থার জন্য সম্পূর্ণ এসএমএস সমাধান',
        price: 8000,
        smsCount: 25000,
        validityDays: 90,
        features: {
          api_access: 'premium',
          support: '24_7_phone',
          delivery: 'instant',
          reporting: 'advanced',
          sender_id: 'multiple',
          analytics: 'advanced',
          scheduling: true,
          dedicated_manager: true,
          custom_integration: true
        },
        isActive: true
      }
    }),

    prisma.package.upsert({
      where: { id: 'premium' },
      update: {},
      create: {
        id: 'premium',
        name: 'Premium',
        nameEn: 'Premium Package',
        nameBn: 'প্রিমিয়াম প্যাকেজ',
        description: 'Ultimate package for maximum performance and features',
        descriptionEn: 'Ultimate SMS package with all features and maximum performance guarantees',
        descriptionBn: 'সর্বোচ্চ কর্মক্ষমতা গ্যারান্টি সহ সব বৈশিষ্ট্য সহ আল্টিমেট এসএমএস প্যাকেজ',
        price: 15000,
        smsCount: 50000,
        validityDays: 120,
        features: {
          api_access: 'ultimate',
          support: 'vip',
          delivery: 'priority_routing',
          reporting: 'real_time',
          sender_id: 'unlimited',
          analytics: 'real_time',
          scheduling: true,
          dedicated_manager: true,
          custom_integration: true,
          white_label: true,
          sla_guarantee: '99.9%'
        },
        isActive: true
      }
    })
  ])

  console.log(`✅ Created ${packages.length} packages`)

  // Create a sample admin user (optional)
  try {
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@btcl.gov.bd' },
      update: {},
      create: {
        email: 'admin@btcl.gov.bd',
        name: 'BTCL Admin',
        phone: '+880-2-9665650',
        company: 'Bangladesh Telecommunications Company Limited',
        password: '$2a$12$LQv3c1yqBWVHxkd0LteEF.5sJ8A6Qe8c3G9p4nP5hZ6P.Cr7Bwqsy', // 'admin123'
        verificationStatus: 'APPROVED',
        emailVerified: new Date()
      }
    })

    console.log(`✅ Created admin user: ${adminUser.email}`)
  } catch (error) {
    console.log('ℹ️ Admin user already exists')
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })