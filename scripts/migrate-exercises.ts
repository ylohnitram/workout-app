import { connectDB } from '@/lib/mongodb';
import { ExerciseModel } from '@/models/exercise';

async function migrateExercises() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Najít všechny cviky
    const exercises = await ExerciseModel.find({});
    console.log(`Found ${exercises.length} exercises to process`);

    for (const exercise of exercises) {
      try {
        const updates: any = {};

        // Systémové cviky
        if (exercise.isSystem) {
          updates.$unset = { userId: 1 };  // Odstraní userId
          updates.$set = { isSystem: true };
        } 
        // Uživatelské cviky (všechny, které nemají isSystem: true)
        else {
          if (!exercise.userId) {
            console.log(`Warning: User exercise without userId found: ${exercise._id}`);
            continue; // Přeskočíme cviky bez userId
          }
          updates.$set = { isSystem: false };
        }

        // Aktualizace cviku
        await ExerciseModel.updateOne(
          { _id: exercise._id },
          updates
        );

        console.log(`Updated exercise: ${exercise.name}`);
      } catch (error) {
        console.error(`Error updating exercise ${exercise._id}:`, error);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Spustit migraci
migrateExercises();
