import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  orderIndex: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const courseNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  pdfUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(pdf)$/i.test(v) || /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid PDF URL'
    }
  },
  fileSize: {
    type: String,
    default: 'Unknown'
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Data Science', 'Mathematics', 'Business', 'Design', 'Other'],
    default: 'Other'
  },
  thumbnail: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v) || /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [courseModuleSchema],
  notes: [courseNoteSchema],
  duration: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  }
}, {
  timestamps: true
});

// Calculate total duration from modules
courseSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    this.duration = this.modules.reduce((total, module) => total + module.duration, 0);
  }
  next();
});

// Virtual for video count
courseSchema.virtual('videoCount').get(function() {
  return this.modules ? this.modules.length : 0;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Course', courseSchema);