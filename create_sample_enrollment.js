import mongoose from 'mongoose';
import User from './server/models/User.js';
import Course from './server/models/Course.js';
import Enrollment from './server/models/Enrollment.js';

// Connect to MongoDB
mongoose.connect('mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS');

async function createSampleEnrollment() {
  try {
    // Find an existing user and course
    const user = await User.findOne({ role: 'student' });
    const course = await Course.findOne();
    
    if (!user) {
      console.log('No student user found');
      return;
    }
    
    if (!course) {
      console.log('No course found');
      return;
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: user._id,
      course: course._id,
      progress: 25
    });
    
    await enrollment.save();
    
    console.log('Sample enrollment created:', {
      student: user.firstName + ' ' + user.lastName,
      course: course.title,
      progress: enrollment.progress
    });
    
  } catch (error) {
    console.error('Error creating sample enrollment:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createSampleEnrollment();