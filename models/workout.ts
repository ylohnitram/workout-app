import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
  }],
  date: {
    type: Date,
    default: Date.now,
  }
});

export const Workout = mongoose.models.Workout || mongoose.model('Workout', workoutSchema); 