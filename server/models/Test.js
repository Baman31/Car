import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  answers: [{
    questionIndex: Number,
    selectedAnswer: String,
    isCorrect: Boolean
  }],
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0
  },
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  }
}, {
  timestamps: true
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 60,
    min: 1
  },
  maxScore: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 3,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  results: [testResultSchema]
}, {
  timestamps: true
});

// Calculate max score from questions
testSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.maxScore = this.questions.reduce((total, question) => total + question.points, 0);
  }
  next();
});

export default mongoose.model('Test', testSchema);