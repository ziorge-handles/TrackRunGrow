import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL must be set')
const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─── School ────────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { id: 'school-lincoln' },
    update: {},
    create: {
      id: 'school-lincoln',
      name: 'Lincoln High School',
      mascot: 'Lions',
      city: 'Springfield',
      state: 'IL',
    },
  })

  console.log('Created school:', school.name)

  // ─── Track Events ──────────────────────────────────────────────────────────
  const trackEvents = [
    { name: '100m', category: 'SPRINT' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '200m', category: 'SPRINT' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '400m', category: 'SPRINT' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '800m', category: 'MIDDLE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '1500m', category: 'MIDDLE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: 'Mile', category: 'MIDDLE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '3000m', category: 'DISTANCE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '5000m', category: 'DISTANCE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '10000m', category: 'DISTANCE' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '100mH', category: 'HURDLES' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '110mH', category: 'HURDLES' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '400mH', category: 'HURDLES' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '4x100', category: 'RELAY' as const, isRelay: true, unitLabel: 'seconds', lowerIsBetter: true },
    { name: '4x400', category: 'RELAY' as const, isRelay: true, unitLabel: 'seconds', lowerIsBetter: true },
    { name: 'High Jump', category: 'JUMP' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Long Jump', category: 'JUMP' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Triple Jump', category: 'JUMP' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Pole Vault', category: 'JUMP' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Shot Put', category: 'THROW' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Discus', category: 'THROW' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Javelin', category: 'THROW' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'Hammer', category: 'THROW' as const, isFieldEvent: true, unitLabel: 'meters', lowerIsBetter: false },
    { name: 'XC 5K', category: 'ROAD' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: 'XC 6K', category: 'ROAD' as const, unitLabel: 'seconds', lowerIsBetter: true },
    { name: 'XC 8K', category: 'ROAD' as const, unitLabel: 'seconds', lowerIsBetter: true },
  ]

  const createdEvents: Record<string, string> = {}
  for (const event of trackEvents) {
    const created = await prisma.trackEvent.upsert({
      where: { name: event.name },
      update: {},
      create: {
        name: event.name,
        category: event.category,
        isRelay: event.isRelay ?? false,
        isFieldEvent: event.isFieldEvent ?? false,
        unitLabel: event.unitLabel,
        lowerIsBetter: event.lowerIsBetter,
      },
    })
    createdEvents[event.name] = created.id
  }

  console.log(`Created ${trackEvents.length} track events`)

  // ─── Coach User ────────────────────────────────────────────────────────────
  const coachPasswordHash = await bcrypt.hash('password123', 12)
  const coachUser = await prisma.user.upsert({
    where: { email: 'coach@demo.com' },
    update: {},
    create: {
      email: 'coach@demo.com',
      name: 'Coach Demo',
      passwordHash: coachPasswordHash,
      role: 'COACH',
    },
  })

  const coach = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      bio: 'Head coach at Lincoln High School. 15 years of experience coaching cross country and track.',
      phoneNumber: '555-0100',
    },
  })

  console.log('Created coach:', coachUser.email)

  // ─── Teams ─────────────────────────────────────────────────────────────────
  const xcTeam = await prisma.team.upsert({
    where: { id: 'team-xc-boys' },
    update: {},
    create: {
      id: 'team-xc-boys',
      schoolId: school.id,
      ownerId: coachUser.id,
      name: 'Varsity XC Boys',
      sport: 'XC',
      season: '2025',
      gender: 'MALE',
      isActive: true,
    },
  })

  const trackTeam = await prisma.team.upsert({
    where: { id: 'team-track-boys' },
    update: {},
    create: {
      id: 'team-track-boys',
      schoolId: school.id,
      ownerId: coachUser.id,
      name: 'Varsity Track Boys',
      sport: 'TRACK',
      season: '2025',
      gender: 'MALE',
      isActive: true,
    },
  })

  // Connect coach to both teams
  await prisma.coachTeam.upsert({
    where: { coachId_teamId: { coachId: coach.id, teamId: xcTeam.id } },
    update: {},
    create: { coachId: coach.id, teamId: xcTeam.id, isPrimary: true },
  })

  await prisma.coachTeam.upsert({
    where: { coachId_teamId: { coachId: coach.id, teamId: trackTeam.id } },
    update: {},
    create: { coachId: coach.id, teamId: trackTeam.id, isPrimary: false },
  })

  console.log('Created teams and coach assignments')

  // ─── Athletes ──────────────────────────────────────────────────────────────
  const athletePasswordHash = await bcrypt.hash('password123', 12)

  const athleteData = [
    { email: 'athlete1@demo.com', name: 'Marcus Johnson', grad: 2026, dob: new Date('2007-03-15') },
    { email: 'athlete2@demo.com', name: 'Tyler Williams', grad: 2026, dob: new Date('2007-07-22') },
    { email: 'athlete3@demo.com', name: 'Jordan Davis', grad: 2027, dob: new Date('2008-01-10') },
    { email: 'athlete4@demo.com', name: 'Kevin Thompson', grad: 2025, dob: new Date('2006-11-05') },
    { email: 'athlete5@demo.com', name: 'Darius Brown', grad: 2027, dob: new Date('2008-05-28') },
  ]

  const athletes: Array<{ userId: string; athleteId: string; name: string }> = []

  for (const data of athleteData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: athletePasswordHash,
        role: 'ATHLETE',
      },
    })

    const athlete = await prisma.athlete.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        gender: 'MALE',
        graduationYear: data.grad,
        dateOfBirth: data.dob,
        status: 'ACTIVE',
      },
    })

    // Add to both teams
    await prisma.athleteTeam.upsert({
      where: { athleteId_teamId: { athleteId: athlete.id, teamId: xcTeam.id } },
      update: {},
      create: { athleteId: athlete.id, teamId: xcTeam.id },
    })

    await prisma.athleteTeam.upsert({
      where: { athleteId_teamId: { athleteId: athlete.id, teamId: trackTeam.id } },
      update: {},
      create: { athleteId: athlete.id, teamId: trackTeam.id },
    })

    athletes.push({ userId: user.id, athleteId: athlete.id, name: data.name })
  }

  console.log(`Created ${athletes.length} athletes`)

  // ─── Body Metrics ──────────────────────────────────────────────────────────
  const metricsData = [
    { heightCm: 178, weightKg: 68, restingHR: 52, maxHR: 195, vo2Max: 62.5, bodyFatPct: 9.2 },
    { heightCm: 182, weightKg: 72, restingHR: 55, maxHR: 192, vo2Max: 58.3, bodyFatPct: 10.1 },
    { heightCm: 170, weightKg: 60, restingHR: 48, maxHR: 200, vo2Max: 65.1, bodyFatPct: 7.8 },
    { heightCm: 175, weightKg: 65, restingHR: 50, maxHR: 197, vo2Max: 61.0, bodyFatPct: 8.5 },
    { heightCm: 168, weightKg: 58, restingHR: 54, maxHR: 198, vo2Max: 59.7, bodyFatPct: 8.9 },
  ]

  for (let i = 0; i < athletes.length; i++) {
    const m = metricsData[i]
    await prisma.bodyMetric.create({
      data: {
        athleteId: athletes[i].athleteId,
        recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        heightCm: m.heightCm,
        weightKg: m.weightKg,
        restingHR: m.restingHR,
        maxHR: m.maxHR,
        vo2Max: m.vo2Max,
        bodyFatPct: m.bodyFatPct,
      },
    })
  }

  console.log('Created body metrics')

  // ─── Races ─────────────────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  const races = await Promise.all([
    prisma.race.create({
      data: {
        teamId: xcTeam.id,
        name: 'Riverside Invitational',
        sport: 'XC',
        location: 'Riverside Park, Springfield',
        date: daysAgo(70),
        isHome: false,
        courseDescription: '5K cross country course with rolling hills',
      },
    }),
    prisma.race.create({
      data: {
        teamId: xcTeam.id,
        name: 'Lincoln Invitational',
        sport: 'XC',
        location: 'Lincoln Park, Springfield',
        date: daysAgo(49),
        isHome: true,
        courseDescription: '5K home course, flat first mile then hilly finish',
      },
    }),
    prisma.race.create({
      data: {
        teamId: xcTeam.id,
        name: 'Regional Championship',
        sport: 'XC',
        location: 'Central Park, Decatur',
        date: daysAgo(28),
        isHome: false,
        courseDescription: 'IHSA Regional 5K championship course',
      },
    }),
    prisma.race.create({
      data: {
        teamId: xcTeam.id,
        name: 'Sectional Meet',
        sport: 'XC',
        location: 'Forest Preserve, Bloomington',
        date: daysAgo(14),
        isHome: false,
        courseDescription: '5K sectional championship',
      },
    }),
    prisma.race.create({
      data: {
        teamId: xcTeam.id,
        name: 'State Championship',
        sport: 'XC',
        location: 'Peoria Park, Peoria',
        date: daysAgo(7),
        isHome: false,
        courseDescription: 'IHSA State 5K course',
      },
    }),
  ])

  console.log(`Created ${races.length} races`)

  // ─── Race Results ──────────────────────────────────────────────────────────
  // XC 5K times in seconds — roughly 16-20 minute range
  const xcEventId = createdEvents['XC 5K']

  // Base times per athlete (in seconds) getting progressively faster across races
  const baseTimesPerAthlete = [
    [1045, 1032, 1020, 1008, 998],   // Marcus — strong #1
    [1080, 1065, 1050, 1038, 1025],  // Tyler
    [1110, 1092, 1078, 1062, 1050],  // Jordan
    [1025, 1015, 1005, 995, 985],    // Kevin — fastest
    [1130, 1115, 1100, 1088, 1075],  // Darius
  ]

  for (let raceIdx = 0; raceIdx < races.length; raceIdx++) {
    const race = races[raceIdx]
    const raceResults = athletes.map((athlete, aIdx) => ({
      athleteId: athlete.athleteId,
      resultValue: baseTimesPerAthlete[aIdx][raceIdx],
      place: 0, // filled below
    }))

    // Sort by time to assign places
    raceResults.sort((a, b) => a.resultValue - b.resultValue)
    raceResults.forEach((r, idx) => { r.place = idx + 1 })

    for (const result of raceResults) {
      await prisma.raceResult.create({
        data: {
          raceId: race.id,
          athleteId: result.athleteId,
          trackEventId: xcEventId,
          resultValue: result.resultValue,
          place: result.place,
          recordedAt: race.date,
        },
      })
    }
  }

  console.log('Created race results')

  // ─── Personal Bests ────────────────────────────────────────────────────────
  for (let aIdx = 0; aIdx < athletes.length; aIdx++) {
    const bestTime = baseTimesPerAthlete[aIdx][4] // last race = fastest
    await prisma.personalBest.upsert({
      where: {
        athleteId_trackEventId: {
          athleteId: athletes[aIdx].athleteId,
          trackEventId: xcEventId,
        },
      },
      update: {},
      create: {
        athleteId: athletes[aIdx].athleteId,
        trackEventId: xcEventId,
        resultValue: bestTime,
        achievedAt: races[4].date,
      },
    })
  }

  console.log('Created personal bests')

  // ─── Workout Logs (4 weeks) ────────────────────────────────────────────────
  const workoutTemplates = [
    { type: 'EASY_RUN' as const, title: 'Easy Recovery Run', distanceMiles: 5, durationMin: 45, effort: 4 },
    { type: 'TEMPO' as const, title: 'Tempo Run', distanceMiles: 6, durationMin: 48, effort: 7 },
    { type: 'INTERVAL' as const, title: '800m Intervals', distanceMiles: 7, durationMin: 55, effort: 8 },
    { type: 'LONG_RUN' as const, title: 'Long Run', distanceMiles: 10, durationMin: 85, effort: 5 },
    { type: 'EASY_RUN' as const, title: 'Morning Shakeout', distanceMiles: 3, durationMin: 28, effort: 3 },
    { type: 'STRENGTH' as const, title: 'Strength & Core', distanceMiles: 0, durationMin: 45, effort: 6 },
    { type: 'REST' as const, title: 'Rest Day', distanceMiles: 0, durationMin: 0, effort: 1 },
  ]

  for (const athlete of athletes) {
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const template = workoutTemplates[day % workoutTemplates.length]
        if (template.type === 'REST') continue

        const workoutDate = new Date(now.getTime() - (week * 7 + (6 - day)) * 24 * 60 * 60 * 1000)

        await prisma.workoutLog.create({
          data: {
            athleteId: athlete.athleteId,
            loggedById: coachUser.id,
            date: workoutDate,
            type: template.type,
            title: template.title,
            distanceMiles: template.distanceMiles || null,
            durationMin: template.durationMin || null,
            avgPaceSecPerMile: template.distanceMiles && template.durationMin
              ? (template.durationMin * 60) / template.distanceMiles
              : null,
            perceivedEffort: template.effort,
          },
        })
      }
    }
  }

  console.log('Created workout logs')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
