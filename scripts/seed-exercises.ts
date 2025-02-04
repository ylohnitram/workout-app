import { Exercise } from '../models/exercise';
import { connectDB } from '../lib/mongodb';

const systemExercises = [
  {
    name: "Bench press",
    category: "Prsa",
    isSystem: true,
    description: "Základní cvik na rozvoj prsních svalů",
    videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    muscleGroups: ["chest", "triceps", "shoulders"]
  },
  // ... další cviky
];

async function seedExercises() {
  await connectDB();
  
  for (const exercise of systemExercises) {
    await Exercise.findOneAndUpdate(
      { name: exercise.name, isSystem: true },
      exercise,
      { upsert: true }
    );
  }
}
