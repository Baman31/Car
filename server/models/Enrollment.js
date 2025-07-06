import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedModules: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one enrollment per user per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Update completion status based on progress
enrollmentSchema.pre('save', function(next) {
  if (this.progress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completionDate = new Date();
  } else if (this.progress < 100) {
    this.isCompleted = false;
    this.completionDate = null;
  }
  next();
});

export default mongoose.model('Enrollment', enrollmentSchema);