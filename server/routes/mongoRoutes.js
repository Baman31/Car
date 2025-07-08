import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Test from '../models/Test.js';
import jwt from 'jsonwebtoken';
import authRoutes from './authRoutes.js';

const router = express.Router();

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin middleware - works with JWT auth
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Student data filter middleware
const filterStudentData = (req, res, next) => {
  if (req.user?.dbUser?.role === 'student') {
    req.studentId = req.user.dbUser._id;
  }
  next();
};

// JWT token verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id; // Support both formats
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    
    // Set both formats for compatibility
    req.user = { 
      id: userId, 
      username: decoded.username, 
      role: decoded.role,
      dbUser: user 
    };
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user has completed setup (for Replit auth flow)
router.post('/auth/check-setup', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    const hasSetup = !!user;
    
    res.json({ hasSetup });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check setup status', error: error.message });
  }
});

// Complete account setup after Replit email verification
router.post('/auth/complete-setup', async (req, res) => {
  try {
    const { email, firstName, lastName, username, password, replitId, profileImageUrl } = req.body;
    
    // Check if user already exists with this email or username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Account already exists with this email or username' 
      });
    }
    
    // Create new user (not approved by default)
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'student',
      isApproved: false, // Requires admin approval
      replitId,
      profileImageUrl
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      message: 'Account setup complete! Your account is pending approval.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
        approvedCourses: user.approvedCourses || []
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Account setup failed', error: error.message });
  }
});

// Email/Password registration (direct registration)
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }
    
    // Create new user (not approved by default)
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'student',
      isApproved: false // Requires admin approval
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Registration successful! Your account is pending approval.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

// Email/Password login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isApproved: user.isApproved,
        approvedCourses: user.approvedCourses || []
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user (JWT authentication)
router.get('/auth/user', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      isApproved: user.isApproved,
      approvedCourses: user.approvedCourses || []
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// User routes
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Course routes - with approval check
router.get('/courses', verifyToken, async (req, res) => {
  try {
    const user = req.user.dbUser;
    
    // Check if user is approved
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Your account is pending approval.',
        requiresApproval: true 
      });
    }
    
    const { category } = req.query;
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // For students, only show enrolled courses
    if (user.role === 'student') {
      const enrolledCourseIds = user.enrolledCourses || [];
      query._id = { $in: enrolledCourseIds };
    }
    
    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName')
      .select('-modules.correctAnswer');
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
});

router.get('/courses/:id', verifyToken, async (req, res) => {
  try {
    const user = req.user.dbUser;
    
    // Check if user is approved
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Your account is pending approval.',
        requiresApproval: true 
      });
    }
    
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // For students, check if they're enrolled in this course
    if (user.role === 'student') {
      const enrolledCourseIds = user.enrolledCourses?.map(id => id.toString()) || [];
      if (!enrolledCourseIds.includes(req.params.id)) {
        return res.status(403).json({ 
          message: 'Access denied. You are not enrolled in this course.' 
        });
      }
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course', error: error.message });
  }
});

// Admin: Create course with modules and notes
router.post('/courses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      thumbnail,
      level,
      price,
      modules,
      notes
    } = req.body;

    // Use admin user ID for instructor
    const adminUser = await User.findOne({ role: 'admin' });
    
    const course = new Course({
      title,
      description,
      category,
      thumbnail,
      level: level || 'Beginner',
      price: price || 0,
      instructor: adminUser._id,
      modules: modules || [],
      notes: notes || []
    });

    await course.save();
    await course.populate('instructor', 'firstName lastName');
    
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create course', error: error.message });
  }
});

// Admin: Update course
router.put('/courses/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update course', error: error.message });
  }
});

// Admin: Delete course
router.delete('/courses/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
});

// Admin: Add module to course
router.post('/courses/:id/modules', async (req, res) => {
  try {
    const { title, description, youtubeUrl, duration, orderIndex } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.modules.push({
      title,
      description,
      youtubeUrl,
      duration,
      orderIndex: orderIndex || course.modules.length
    });
    
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: 'Failed to add module', error: error.message });
  }
});

// Admin: Add note to course
router.post('/courses/:id/notes', async (req, res) => {
  try {
    const { title, pdfUrl, fileSize } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.notes.push({
      title,
      pdfUrl,
      fileSize: fileSize || 'Unknown'
    });
    
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: 'Failed to add note', error: error.message });
  }
});

// Get course modules
router.get('/courses/:id/modules', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course.modules.sort((a, b) => a.orderIndex - b.orderIndex));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch modules', error: error.message });
  }
});

// Get course notes
router.get('/courses/:id/notes', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course.notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
});

// Enrollment routes
router.get('/users/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.id })
      .populate('course', 'title description category thumbnail duration videoCount');
    
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollments', error: error.message });
  }
});

router.post('/enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    const enrollment = new Enrollment({
      student: userId,
      course: courseId
    });
    
    await enrollment.save();
    await enrollment.populate('course', 'title description category thumbnail duration videoCount');
    
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create enrollment', error: error.message });
  }
});

// Update enrollment progress
router.put('/enrollments/:studentId/:courseId/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: req.params.studentId, course: req.params.courseId },
      { progress },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
});

// Public platform stats endpoint (no authentication required)
router.get('/platform/stats', async (req, res) => {
  try {
    // Get total unique students enrolled
    const activeStudents = await Enrollment.distinct('student');
    
    // Get total courses available
    const totalCourses = await Course.countDocuments();
    
    // Calculate average rating from test results (placeholder implementation)
    const averageRating = 4.8; // This would be calculated from actual ratings
    
    res.json({
      activeStudents: activeStudents.length,
      totalCourses,
      averageRating
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Failed to fetch platform stats', error: error.message });
  }
});

// Create sample enrollment for demonstration (temporary endpoint)
router.get('/create-sample-enrollment', async (req, res) => {
  try {
    console.log('Creating sample enrollment...');
    
    // Find an existing student user
    const user = await User.findOne({ role: 'student' });
    console.log('Found user:', user ? `${user.firstName} ${user.lastName}` : 'None');
    
    if (!user) {
      return res.status(404).json({ message: 'No student user found' });
    }
    
    // Find an existing course
    const course = await Course.findOne();
    console.log('Found course:', course ? course.title : 'None');
    
    if (!course) {
      return res.status(404).json({ message: 'No course found' });
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });
    
    if (existingEnrollment) {
      console.log('Enrollment already exists');
      return res.json({ message: 'Enrollment already exists', alreadyExists: true });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: user._id,
      course: course._id,
      progress: 25
    });
    
    await enrollment.save();
    console.log('Enrollment created successfully');
    
    res.json({
      message: 'Sample enrollment created successfully',
      enrollment: {
        student: user.firstName + ' ' + user.lastName,
        course: course.title,
        progress: enrollment.progress
      }
    });
  } catch (error) {
    console.error('Error creating sample enrollment:', error);
    res.status(500).json({ message: 'Failed to create sample enrollment', error: error.message });
  }
});

// User stats - students can only see their own stats
router.get('/users/:id/stats', filterStudentData, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // If student, only allow access to their own stats
    if (req.user?.dbUser?.role === 'student' && req.user.dbUser._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const enrollments = await Enrollment.find({ student: userId }).populate('course');
    const enrolledCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    
    let hoursLearned = 0;
    enrollments.forEach(enrollment => {
      if (enrollment.course) {
        hoursLearned += Math.floor((enrollment.course.duration * enrollment.progress) / 100);
      }
    });
    
    // Calculate average test scores (implement when tests are added)
    const averageScore = 85; // Placeholder
    
    res.json({
      enrolledCourses,
      completedCourses,
      hoursLearned,
      averageScore
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user stats', error: error.message });
  }
});

// Test management routes
router.get('/tests', async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = { isActive: true };
    
    if (courseId) {
      query.course = courseId;
    }
    
    const tests = await Test.find(query)
      .populate('course', 'title category')
      .select('-questions.correctAnswer -results.answers');
    
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tests', error: error.message });
  }
});

router.get('/tests/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('course', 'title category')
      .populate('results.student', 'firstName lastName email');
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch test', error: error.message });
  }
});

// Admin: Create test
router.post('/tests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      questions,
      timeLimit,
      passingScore,
      attempts,
      maxScore
    } = req.body;

    const test = new Test({
      title,
      description,
      course: courseId,
      questions: questions || [],
      timeLimit: timeLimit || 60,
      passingScore: passingScore || 60,
      attempts: attempts || 3,
      maxScore: maxScore || 100
    });

    await test.save();
    await test.populate('course', 'title category');
    
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create test', error: error.message });
  }
});

// Admin: Update test
router.put('/tests/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      courseId,
      questions,
      timeLimit,
      passingScore,
      attempts,
      maxScore
    } = req.body;

    const test = await Test.findByIdAndUpdate(id, {
      title,
      description,
      course: courseId,
      questions: questions || [],
      timeLimit: timeLimit || 60,
      passingScore: passingScore || 60,
      attempts: attempts || 3,
      maxScore: maxScore || 100
    }, { new: true }).populate('course', 'title category');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update test', error: error.message });
  }
});

// Admin: Delete test
router.delete('/tests/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const test = await Test.findByIdAndDelete(id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete test', error: error.message });
  }
});

// Admin: Add/Update test result for a student
router.post('/tests/:testId/results', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { testId } = req.params;
    const { studentId, score, grade, answers, maxScore } = req.body;

    // Validate required fields
    if (!studentId || score === undefined || !grade) {
      return res.status(400).json({ message: 'Missing required fields: studentId, score, and grade are required' });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student already has a result for this test
    const existingResultIndex = test.results.findIndex(
      result => result.student.toString() === studentId
    );

    const resultData = {
      student: studentId,
      score: Number(score),
      maxScore: Number(maxScore) || test.maxScore || 100,
      grade,
      answers: answers || [],
      completedAt: new Date()
    };

    if (existingResultIndex !== -1) {
      // Update existing result
      test.results[existingResultIndex] = { ...test.results[existingResultIndex].toObject(), ...resultData };
    } else {
      // Add new result
      test.results.push(resultData);
    }

    await test.save();
    await test.populate('results.student', 'firstName lastName email');
    
    res.json({ message: 'Grade saved successfully', test });
  } catch (error) {
    console.error('Error saving test result:', error);
    res.status(400).json({ message: 'Failed to add test result', error: error.message });
  }
});



// Get student ID by username (for finding current user)
router.get('/students/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const student = await User.findOne({ username, role: 'student' }, '_id firstName lastName email username');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student', error: error.message });
  }
});

// Get student's own test results
router.get('/student/my-results', verifyToken, async (req, res) => {
  try {
    const currentUser = req.user?.dbUser;
    if (!currentUser || currentUser.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }
    
    const tests = await Test.find({ isActive: true })
      .populate('course', 'title category')
      .select('title course results maxScore');
    
    const myResults = [];
    
    tests.forEach(test => {
      const result = test.results.find(
        r => r.student.toString() === currentUser._id.toString()
      );
      
      if (result) {
        myResults.push({
          testId: test._id,
          testTitle: test.title,
          course: test.course,
          maxScore: test.maxScore,
          score: result.score,
          grade: result.grade,
          completedAt: result.completedAt
        });
      }
    });
    
    res.json(myResults);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch test results', error: error.message });
  }
});

// Get all students with their test results for admin
router.get('/admin/student-results', verifyToken, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('firstName lastName email');
    
    const tests = await Test.find({ isActive: true })
      .populate('course', 'title category')
      .select('title course results maxScore');
    
    const studentResults = students.map(student => {
      const testResults = tests.map(test => {
        const result = test.results.find(
          r => r.student.toString() === student._id.toString()
        );
        
        return {
          testId: test._id,
          testTitle: test.title,
          course: test.course,
          maxScore: test.maxScore,
          result: result || null
        };
      });
      
      return {
        student,
        testResults
      };
    });
    
    res.json(studentResults);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student results', error: error.message });
  }
});

// Admin: Get students enrolled in a specific course
router.get('/admin/course/:courseId/students', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Find students enrolled through both methods:
    // 1. Traditional enrollment records
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'firstName lastName email _id role')
      .select('student');
    
    // 2. Users with this course in their enrolledCourses array (from approval system)
    const usersWithCourse = await User.find({ 
      enrolledCourses: courseId,
      role: 'student',
      isApproved: true
    }).select('firstName lastName email _id role');
    
    // Combine and deduplicate students
    const enrollmentStudents = enrollments.map(enrollment => enrollment.student)
      .filter(student => student && student.role === 'student');
    
    const allStudents = [...enrollmentStudents, ...usersWithCourse];
    
    // Remove duplicates based on _id
    const uniqueStudents = allStudents.filter((student, index, self) => 
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );
    
    res.json(uniqueStudents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course students', error: error.message });
  }
});

// Admin: Get pending user approvals
router.get('/admin/pending-approvals', verifyToken, requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: 'student'
    }).select('-password');
    
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending approvals', error: error.message });
  }
});

// Admin: Approve user and assign courses
router.post('/admin/approve-user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseIds } = req.body;
    const adminId = req.user?.dbUser?._id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        approvedCourses: courseIds || []
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User approved successfully',
      user 
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to approve user', error: error.message });
  }
});

// Admin: Reject user
router.post('/admin/reject-user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to reject user', error: error.message });
  }
});

// Comprehensive Admin stats with real-time data
router.get('/admin/stats', async (req, res) => {
  try {
    // Basic counts
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const approvedStudents = await User.countDocuments({ role: 'student', isApproved: true });
    
    // Get all enrollments for student analytics
    const enrollments = await Enrollment.find({})
      .populate('student', 'firstName lastName')
      .populate('course', 'title');
    
    const totalEnrollments = enrollments.length;
    
    // Calculate unique students enrolled (distinct student IDs in enrollments)
    const uniqueStudentIds = new Set(enrollments.map(e => e.student._id.toString()));
    const uniqueStudentsEnrolled = uniqueStudentIds.size;
    
    // Calculate average completion rate
    let totalProgress = 0;
    let enrollmentCount = 0;
    enrollments.forEach(enrollment => {
      if (enrollment.progress !== undefined) {
        totalProgress += enrollment.progress;
        enrollmentCount++;
      }
    });
    const averageCompletion = enrollmentCount > 0 ? Math.round(totalProgress / enrollmentCount) : 0;
    
    // Get test results for score calculation
    const tests = await Test.find({}).populate('course', 'title');
    let totalTestResults = 0;
    let totalScore = 0;
    
    tests.forEach(test => {
      if (test.results && test.results.length > 0) {
        test.results.forEach(result => {
          totalTestResults++;
          // Calculate percentage score
          const percentage = (result.score / result.maxScore) * 100;
          totalScore += percentage;
        });
      }
    });
    
    const averageScore = totalTestResults > 0 ? Math.round(totalScore / totalTestResults) : 0;
    
    // Calculate course completion stats
    const completedEnrollments = enrollments.filter(e => e.progress >= 100).length;
    const courseCompletionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    
    res.json({
      totalCourses,
      totalStudents: totalStudents,
      studentsEnrolled: totalEnrollments,
      uniqueStudentsEnrolled: uniqueStudentsEnrolled,
      averageScore,
      averageCompletion,
      courseCompletionRate,
      completedCourses: completedEnrollments,
      testsCompleted: totalTestResults,
      approvedStudents,
      activeCourses
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
  }
});

// Student: Get test results for a specific student
router.get('/students/:studentId/test-results', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const tests = await Test.find({ isActive: true })
      .populate('course', 'title category')
      .populate('results.student', 'firstName lastName email');
    
    const studentResults = tests.map(test => {
      const studentResult = test.results?.find(result => 
        result.student._id.toString() === studentId
      );
      
      return {
        testId: test._id,
        testTitle: test.title,
        course: test.course,
        maxScore: test.maxScore || 100,
        result: studentResult || null
      };
    });
    
    res.json(studentResults);
  } catch (error) {
    console.error('Error fetching student test results:', error);
    res.status(500).json({ message: 'Failed to fetch student test results', error: error.message });
  }
});

// Get all users (admin only)
router.get('/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('enrolledCourses');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Approve user with course enrollment (admin only)
router.put('/admin/users/:id/approval', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, enrolledCourses = [] } = req.body;
    
    const updateData = { isApproved };
    if (isApproved && enrolledCourses.length > 0) {
      updateData.enrolledCourses = enrolledCourses;
    }
    
    const user = await User.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    ).select('-password').populate('enrolledCourses');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: `User ${isApproved ? 'approved and enrolled in courses' : 'rejected'} successfully`,
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user approval', error: error.message });
  }
});

// Suspend user from courses (admin only)
router.put('/admin/users/:id/suspend', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { coursesToRemove } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove specified courses from user's enrolled courses
    user.enrolledCourses = user.enrolledCourses.filter(
      courseId => !coursesToRemove.includes(courseId.toString())
    );
    
    await user.save();
    
    const updatedUser = await User.findById(id).select('-password').populate('enrolledCourses');
    
    res.json({ 
      message: 'User suspended from selected courses successfully',
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to suspend user', error: error.message });
  }
});

// Edit user courses (admin only)
router.put('/admin/users/:id/courses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { enrolledCourses } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id, 
      { enrolledCourses },
      { new: true }
    ).select('-password').populate('enrolledCourses');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User courses updated successfully',
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user courses', error: error.message });
  }
});

// Use auth routes
router.use('/auth', authRoutes);

export default router;