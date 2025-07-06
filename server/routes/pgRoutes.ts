import express from 'express';
import { db } from '../db.js';
import { users, courses, enrollments, tests, testResults, courseModules, courseNotes } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.dbUser?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Student data filter middleware
const filterStudentData = (req: any, res: any, next: any) => {
  if (req.user?.dbUser?.role === 'student') {
    req.studentId = req.user.dbUser.id;
  }
  next();
};

// JWT token verification middleware
const verifyToken = async (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userResult = await db.select().from(users).where(eq(users.id, decoded.id));
    
    if (!userResult.length) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    
    req.user = { ...decoded, dbUser: userResult[0] };
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Check if user has completed setup
router.post('/auth/check-setup', async (req, res) => {
  try {
    const { email } = req.body;
    
    const userResult = await db.select().from(users).where(eq(users.email, email));
    const hasSetup = userResult.length > 0;
    
    res.json({ hasSetup });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to check setup status', error: error.message });
  }
});

// Complete account setup after Replit email verification
router.post('/auth/complete-setup', async (req, res) => {
  try {
    const { email, firstName, lastName, username, password, replitId, profileImageUrl } = req.body;
    
    // Check if user already exists with this email or username
    const existingUserByEmail = await db.select().from(users).where(eq(users.email, email));
    const existingUserByUsername = await db.select().from(users).where(eq(users.username, username));
    
    if (existingUserByEmail.length || existingUserByUsername.length) {
      return res.status(400).json({ 
        message: 'Account already exists with this email or username' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUsers = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'student',
      isActive: false, // Requires admin approval
      avatar: profileImageUrl
    }).returning();
    
    const user = newUsers[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Account setup completed successfully. Waiting for admin approval.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isActive
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to complete setup', error: error.message });
  }
});

// Register user (email/password authentication)
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUserByEmail = await db.select().from(users).where(eq(users.email, email));
    const existingUserByUsername = await db.select().from(users).where(eq(users.username, username));
    
    if (existingUserByEmail.length || existingUserByUsername.length) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUsers = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'student',
      isActive: false // Requires admin approval
    }).returning();
    
    const user = newUsers[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Registration successful. Waiting for admin approval.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isActive
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user (email/password authentication)
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const userByUsername = await db.select().from(users).where(eq(users.username, username));
    const userByEmail = await db.select().from(users).where(eq(users.email, username));
    
    const user = userByUsername.length ? userByUsername[0] : userByEmail[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isActive
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    }).from(users);
    
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Approve/reject user (admin only)
router.put('/users/:id/approval', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    await db.update(users)
      .set({ isActive: isApproved })
      .where(eq(users.id, parseInt(id)));
    
    res.json({ message: `User ${isApproved ? 'approved' : 'rejected'} successfully` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user approval', error: error.message });
  }
});

// Get all courses
router.get('/courses', verifyToken, async (req, res) => {
  try {
    const allCourses = await db.select().from(courses);
    res.json(allCourses);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
});

// Create course (admin only)
router.post('/courses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, thumbnail, duration, videoCount, instructorId, modules, notes } = req.body;
    
    // Create course
    const newCourses = await db.insert(courses).values({
      title,
      description,
      category,
      thumbnail,
      duration,
      videoCount,
      instructorId
    }).returning();
    
    const course = newCourses[0];
    
    // Create modules if provided
    if (modules && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        await db.insert(courseModules).values({
          courseId: course.id,
          title: module.title,
          description: module.description,
          videoUrl: module.videoUrl,
          duration: module.duration,
          orderIndex: i
        });
      }
    }
    
    // Create notes if provided
    if (notes && notes.length > 0) {
      for (const note of notes) {
        await db.insert(courseNotes).values({
          courseId: course.id,
          title: note.title,
          fileName: note.fileName,
          fileSize: note.fileSize,
          downloadUrl: note.downloadUrl
        });
      }
    }
    
    res.json({ message: 'Course created successfully', course });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create course', error: error.message });
  }
});

// Get course details with modules and notes
router.get('/courses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await db.select().from(courses).where(eq(courses.id, parseInt(id)));
    if (!course.length) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const modules = await db.select().from(courseModules).where(eq(courseModules.courseId, parseInt(id)));
    const notes = await db.select().from(courseNotes).where(eq(courseNotes.courseId, parseInt(id)));
    
    res.json({
      ...course[0],
      modules,
      notes
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch course details', error: error.message });
  }
});

// Create test (admin only)
router.post('/tests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { courseId, title, maxScore, timeLimit } = req.body;
    
    const newTests = await db.insert(tests).values({
      courseId,
      title,
      maxScore,
      timeLimit
    }).returning();
    
    res.json({ message: 'Test created successfully', test: newTests[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create test', error: error.message });
  }
});

// Get all tests
router.get('/tests', verifyToken, async (req, res) => {
  try {
    const allTests = await db.select().from(tests);
    res.json(allTests);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tests', error: error.message });
  }
});

// Submit test result (admin grades student)
router.post('/test-results', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { testId, userId, score, maxScore, grade } = req.body;
    
    const newResults = await db.insert(testResults).values({
      testId,
      userId,
      score,
      maxScore,
      grade
    }).returning();
    
    res.json({ message: 'Test result submitted successfully', result: newResults[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to submit test result', error: error.message });
  }
});

// Get test results for a user
router.get('/test-results/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Students can only see their own results
    if (req.user.dbUser.role === 'student' && req.user.dbUser.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const results = await db.select().from(testResults).where(eq(testResults.userId, parseInt(userId)));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch test results', error: error.message });
  }
});

export default router;