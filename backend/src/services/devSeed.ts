import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { WorkoutPlanModel } from '../models/WorkoutPlan';
import { encryptValue, hashIdentifier } from '../utils/crypto';

const seedUsers = [
  {
    email: 'maazyounas@gmail.com',
    password: 'Maazyounas@123',
    profile: {
      name: 'FITRACK Admin',
      age: 30,
      gender: 'other' as const,
    },
    isAdmin: true,
  },
  {
    email: 'demo.user@fitrack.test',
    password: 'DemoUser123!',
    profile: {
      name: 'Demo User',
      age: 25,
      gender: 'male' as const,
      profilePictureUrl: 'https://i.pravatar.cc/150?img=12',
    },
  },
  {
    email: 'ahmed.khan@fitrack.dev',
    password: 'DemoUser@123',
    profile: {
      name: 'Ahmed Khan',
      age: 27,
      gender: 'male' as const,
      profilePictureUrl: 'https://i.pravatar.cc/150?img=12',
    },
  },
  {
    email: 'sana.ali@fitrack.dev',
    password: 'DemoUser@123',
    profile: {
      name: 'Sana Ali',
      age: 25,
      gender: 'female' as const,
      profilePictureUrl: 'https://i.pravatar.cc/150?img=47',
    },
  },
  {
    email: 'hamza.rehman@fitrack.dev',
    password: 'DemoUser@123',
    profile: {
      name: 'Hamza Rehman',
      age: 29,
      gender: 'male' as const,
      profilePictureUrl: 'https://i.pravatar.cc/150?img=33',
    },
  },
] as const;

const demoWorkout = {
  name: 'Demo Full Body',
  description: 'Seeded workout for local development',
  difficulty: 'beginner' as const,
  estimatedDurationMinutes: 35,
  exercises: [
    {
      name: 'Goblet Squat',
      muscleGroup: 'Legs',
      equipment: 'Dumbbell',
      sets: 3,
      reps: 10,
      restSeconds: 60,
      notes: '',
      intensity: 'moderate' as const,
      order: 1,
    },
    {
      name: 'Push-Up',
      muscleGroup: 'Chest',
      equipment: 'Bodyweight',
      sets: 3,
      reps: 12,
      restSeconds: 45,
      notes: '',
      intensity: 'moderate' as const,
      order: 2,
    },
    {
      name: 'Bent-Over Row',
      muscleGroup: 'Back',
      equipment: 'Dumbbell',
      sets: 3,
      reps: 12,
      restSeconds: 60,
      notes: '',
      intensity: 'moderate' as const,
      order: 3,
    },
  ],
};

export async function seedDevelopmentData() {
  const saltRounds = 10;

  for (const userSeed of seedUsers) {
    const emailHash = hashIdentifier(userSeed.email);
    const existing = await UserModel.findOne({ emailHash });

    if (existing) {
      continue;
    }

    const passwordHash = await bcrypt.hash(userSeed.password, saltRounds);
    await UserModel.create({
      emailEncrypted: encryptValue(userSeed.email),
      emailHash,
      passwordHash,
      profile: userSeed.profile,
      isAdmin: 'isAdmin' in userSeed ? userSeed.isAdmin : false,
      verification: {
        emailVerified: true,
        phoneVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  const demoUser = await UserModel.findOne({ emailHash: hashIdentifier('demo.user@fitrack.test') });
  if (demoUser) {
    const existingWorkout = await WorkoutPlanModel.findOne({
      ownerId: demoUser.id,
      name: demoWorkout.name,
    });

    if (!existingWorkout) {
      await WorkoutPlanModel.create({
        ownerId: demoUser.id,
        ...demoWorkout,
        isTemplate: false,
        sourceTemplateKey: '',
        schedule: [],
      });
    }
  }

  console.log('Development seed completed.');
  console.log('Demo login: demo.user@fitrack.test / DemoUser123!');
}
