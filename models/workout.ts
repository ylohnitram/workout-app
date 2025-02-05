import mongoose, { Schema, Document } from 'mongoose';
import { ExerciseSet, SetType } from './exercise';

interface WorkoutExercise {
 exerciseId: string;
 isSystem: boolean;
 name: string;  // Ukládáme i název pro případ, že by byl cvik smazán
 sets: ExerciseSet[];
}

export interface IWorkout extends Document {
 userId: string;
 name: string;
 date: Date;
 exercises: WorkoutExercise[];
 notes?: string;
 createdAt: Date;
 updatedAt: Date;
}

const DropSetSchema = new Schema({
 weight: {
   type: Number,
   required: true
 },
 reps: {
   type: Number,
   required: true
 }
});

const ExerciseSetSchema = new Schema({
 type: {
   type: String,
   enum: Object.values(SetType),
   required: true,
   default: SetType.NORMAL
 },
 weight: {
   type: Number,
   required: true
 },
 reps: {
   type: Schema.Types.Mixed,
   required: true
 },
 restPauseSeconds: {
   type: Number,
   required: false
 },
 dropSets: {
   type: [DropSetSchema],
   required: false
 }
});

const WorkoutExerciseSchema = new Schema({
 exerciseId: {
   type: String,
   required: true
 },
 isSystem: {
   type: Boolean,
   required: true
 },
 name: {
   type: String,
   required: true
 },
 sets: {
   type: [ExerciseSetSchema],
   required: true,
   default: []
 }
});

const WorkoutSchema = new Schema<IWorkout>({
 userId: {
   type: String,
   required: true,
   index: true
 },
 name: {
   type: String,
   required: true
 },
 date: {
   type: Date,
   required: true,
   default: Date.now
 },
 exercises: {
   type: [WorkoutExerciseSchema],
   default: []
 },
 notes: {
   type: String
 }
}, {
 timestamps: true
});

export const Workout = mongoose.models.Workout || mongoose.model<IWorkout>('Workout', WorkoutSchema);
