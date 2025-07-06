import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS?retryWrites=true&w=majority&appName=himanshu';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin user if it doesn't exist
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const { default: User } = await import('../models/User.js');
    
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@eduplatform.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      });
      
      await admin.save();
      console.log('Default admin user created');
    }

    // Create default student user if it doesn't exist
    const studentExists = await User.findOne({ username: 'john' });
    
    if (!studentExists) {
      const student = new User({
        username: 'john',
        email: 'john@example.com',
        password: 'john123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      });
      
      await student.save();
      console.log('Default student user created');
    }
    
  } catch (error) {
    console.error('Error creating default users:', error.message);
  }
};

export default connectDB;