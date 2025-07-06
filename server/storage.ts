import {
  users, courses, courseModules, courseNotes, enrollments, tests, testResults, recentActivities,
  type User, type InsertUser, type Course, type InsertCourse, type CourseModule, type InsertCourseModule,
  type CourseNote, type InsertCourseNote, type Enrollment, type InsertEnrollment, type Test, type InsertTest,
  type TestResult, type InsertTestResult, type RecentActivity, type InsertRecentActivity
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Courses
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Course Modules
  getCourseModules(courseId: number): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: number, module: Partial<InsertCourseModule>): Promise<CourseModule | undefined>;

  // Course Notes
  getCourseNotes(courseId: number): Promise<CourseNote[]>;
  createCourseNote(note: InsertCourseNote): Promise<CourseNote>;

  // Enrollments
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(userId: number, courseId: number, progress: number): Promise<Enrollment | undefined>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestsByCourse(courseId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;

  // Test Results
  getTestResult(id: number): Promise<TestResult | undefined>;
  getTestResultsByUser(userId: number): Promise<TestResult[]>;
  getTestResultsByTest(testId: number): Promise<TestResult[]>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;

  // Recent Activities
  getRecentActivitiesByUser(userId: number, limit?: number): Promise<RecentActivity[]>;
  createRecentActivity(activity: InsertRecentActivity): Promise<RecentActivity>;

  // Dashboard Stats
  getUserStats(userId: number): Promise<{
    enrolledCourses: number;
    completedCourses: number;
    hoursLearned: number;
    averageScore: number;
  }>;

  getAdminStats(): Promise<{
    totalUsers: number;
    activeCourses: number;
    testsCompleted: number;
    averageScore: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private courses: Map<number, Course> = new Map();
  private courseModules: Map<number, CourseModule> = new Map();
  private courseNotes: Map<number, CourseNote> = new Map();
  private enrollments: Map<number, Enrollment> = new Map();
  private tests: Map<number, Test> = new Map();
  private testResults: Map<number, TestResult> = new Map();
  private recentActivities: Map<number, RecentActivity> = new Map();

  private currentId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed admin user
    const adminUser: User = {
      id: this.currentId++,
      username: "admin",
      email: "admin@eduplatform.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Seed student user
    const studentUser: User = {
      id: this.currentId++,
      username: "john",
      email: "john@example.com",
      password: "john123",
      firstName: "John",
      lastName: "Smith",
      role: "student",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(studentUser.id, studentUser);

    // Seed courses
    const webDevCourse: Course = {
      id: this.currentId++,
      title: "Web Development Fundamentals",
      description: "Learn HTML, CSS, JavaScript, and React to build modern web applications",
      category: "Programming",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      duration: 24,
      videoCount: 18,
      instructorId: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.courses.set(webDevCourse.id, webDevCourse);

    const dataScienceCourse: Course = {
      id: this.currentId++,
      title: "Data Science with Python",
      description: "Master data analysis, visualization, and machine learning with Python",
      category: "Data Science",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      duration: 32,
      videoCount: 25,
      instructorId: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.courses.set(dataScienceCourse.id, dataScienceCourse);

    const mathCourse: Course = {
      id: this.currentId++,
      title: "Advanced Mathematics",
      description: "Calculus, Linear Algebra, and Differential Equations for Engineers",
      category: "Mathematics",
      thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      duration: 28,
      videoCount: 22,
      instructorId: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.courses.set(mathCourse.id, mathCourse);

    // Seed enrollments
    const enrollment1: Enrollment = {
      id: this.currentId++,
      userId: 2,
      courseId: 3,
      progress: 65,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment1.id, enrollment1);

    const enrollment2: Enrollment = {
      id: this.currentId++,
      userId: 2,
      courseId: 4,
      progress: 0,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment2.id, enrollment2);

    const enrollment3: Enrollment = {
      id: this.currentId++,
      userId: 2,
      courseId: 5,
      progress: 100,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment3.id, enrollment3);

    // Seed course modules
    const modules = [
      {
        id: this.currentId++,
        courseId: 3,
        title: "Introduction to JavaScript",
        description: "Basic concepts and syntax",
        videoUrl: "https://example.com/video1.mp4",
        duration: 8,
        orderIndex: 1,
        isCompleted: true,
      },
      {
        id: this.currentId++,
        courseId: 3,
        title: "Variables and Data Types",
        description: "Understanding JavaScript variables",
        videoUrl: "https://example.com/video2.mp4",
        duration: 12,
        orderIndex: 2,
        isCompleted: false,
      },
      {
        id: this.currentId++,
        courseId: 3,
        title: "Functions and Scope",
        description: "Working with functions",
        videoUrl: "https://example.com/video3.mp4",
        duration: 15,
        orderIndex: 3,
        isCompleted: false,
      },
    ];
    modules.forEach(module => this.courseModules.set(module.id, module));

    // Seed course notes
    const notes = [
      {
        id: this.currentId++,
        courseId: 3,
        title: "JavaScript Fundamentals.pdf",
        fileName: "javascript-fundamentals.pdf",
        fileSize: "2.3 MB",
        downloadUrl: "/api/notes/download/1",
      },
      {
        id: this.currentId++,
        courseId: 3,
        title: "Exercise Solutions.pdf",
        fileName: "exercise-solutions.pdf",
        fileSize: "1.8 MB",
        downloadUrl: "/api/notes/download/2",
      },
    ];
    notes.forEach(note => this.courseNotes.set(note.id, note));

    // Seed tests
    const webTest: Test = {
      id: this.currentId++,
      courseId: 3,
      title: "JavaScript Quiz",
      maxScore: 100,
      timeLimit: 60,
      isActive: true,
      createdAt: new Date(),
    };
    this.tests.set(webTest.id, webTest);

    const dataTest: Test = {
      id: this.currentId++,
      courseId: 4,
      title: "Data Structures",
      maxScore: 100,
      timeLimit: 90,
      isActive: true,
      createdAt: new Date(),
    };
    this.tests.set(dataTest.id, dataTest);

    const mathTest: Test = {
      id: this.currentId++,
      courseId: 5,
      title: "Calculus Final",
      maxScore: 100,
      timeLimit: 120,
      isActive: true,
      createdAt: new Date(),
    };
    this.tests.set(mathTest.id, mathTest);

    // Seed test results
    const results = [
      {
        id: this.currentId++,
        testId: webTest.id,
        userId: 2,
        score: 92,
        maxScore: 100,
        grade: "A",
        completedAt: new Date("2024-10-15"),
      },
      {
        id: this.currentId++,
        testId: dataTest.id,
        userId: 2,
        score: 78,
        maxScore: 100,
        grade: "B",
        completedAt: new Date("2024-10-12"),
      },
      {
        id: this.currentId++,
        testId: mathTest.id,
        userId: 2,
        score: 95,
        maxScore: 100,
        grade: "A+",
        completedAt: new Date("2024-10-08"),
      },
    ];
    results.forEach(result => this.testResults.set(result.id, result));

    // Seed recent activities
    const activities = [
      {
        id: this.currentId++,
        userId: 2,
        type: "completed_video",
        description: 'Completed "Introduction to Machine Learning"',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: this.currentId++,
        userId: 2,
        type: "scored_test",
        description: 'Scored 92% on "Data Structures Quiz"',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: this.currentId++,
        userId: 2,
        type: "downloaded_notes",
        description: 'Downloaded "Python Fundamentals Notes"',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];
    activities.forEach(activity => this.recentActivities.set(activity.id, activity));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentId++,
      role: insertUser.role || "student",
      isActive: insertUser.isActive ?? true,
      avatar: insertUser.avatar || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.isActive);
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.category === category && course.isActive
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const course: Course = {
      ...insertCourse,
      id: this.currentId++,
      isActive: insertCourse.isActive ?? true,
      createdAt: new Date(),
    };
    this.courses.set(course.id, course);
    return course;
  }

  async updateCourse(id: number, updateCourse: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...updateCourse };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const course = this.courses.get(id);
    if (!course) return false;
    
    const updatedCourse = { ...course, isActive: false };
    this.courses.set(id, updatedCourse);
    return true;
  }

  // Course Module methods
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return Array.from(this.courseModules.values())
      .filter(module => module.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createCourseModule(insertModule: InsertCourseModule): Promise<CourseModule> {
    const module: CourseModule = {
      ...insertModule,
      id: this.currentId++,
      description: insertModule.description || null,
      videoUrl: insertModule.videoUrl || null,
      isCompleted: insertModule.isCompleted ?? false,
    };
    this.courseModules.set(module.id, module);
    return module;
  }

  async updateCourseModule(id: number, updateModule: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    const module = this.courseModules.get(id);
    if (!module) return undefined;
    
    const updatedModule = { ...module, ...updateModule };
    this.courseModules.set(id, updatedModule);
    return updatedModule;
  }

  // Course Notes methods
  async getCourseNotes(courseId: number): Promise<CourseNote[]> {
    return Array.from(this.courseNotes.values()).filter(note => note.courseId === courseId);
  }

  async createCourseNote(insertNote: InsertCourseNote): Promise<CourseNote> {
    const note: CourseNote = {
      ...insertNote,
      id: this.currentId++,
    };
    this.courseNotes.set(note.id, note);
    return note;
  }

  // Enrollment methods
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.userId === userId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.courseId === courseId);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const enrollment: Enrollment = {
      ...insertEnrollment,
      id: this.currentId++,
      progress: insertEnrollment.progress ?? 0,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async updateEnrollmentProgress(userId: number, courseId: number, progress: number): Promise<Enrollment | undefined> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, progress };
    this.enrollments.set(enrollment.id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Test methods
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async getTestsByCourse(courseId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => test.courseId === courseId && test.isActive);
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const test: Test = {
      ...insertTest,
      id: this.currentId++,
      isActive: insertTest.isActive ?? true,
      timeLimit: insertTest.timeLimit || null,
      createdAt: new Date(),
    };
    this.tests.set(test.id, test);
    return test;
  }

  async updateTest(id: number, updateTest: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...updateTest };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  // Test Result methods
  async getTestResult(id: number): Promise<TestResult | undefined> {
    return this.testResults.get(id);
  }

  async getTestResultsByUser(userId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(result => result.userId === userId);
  }

  async getTestResultsByTest(testId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(result => result.testId === testId);
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const result: TestResult = {
      ...insertResult,
      id: this.currentId++,
      completedAt: new Date(),
    };
    this.testResults.set(result.id, result);
    return result;
  }

  // Recent Activities methods
  async getRecentActivitiesByUser(userId: number, limit = 10): Promise<RecentActivity[]> {
    return Array.from(this.recentActivities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async createRecentActivity(insertActivity: InsertRecentActivity): Promise<RecentActivity> {
    const activity: RecentActivity = {
      ...insertActivity,
      id: this.currentId++,
      createdAt: new Date(),
    };
    this.recentActivities.set(activity.id, activity);
    return activity;
  }

  // Dashboard Stats methods
  async getUserStats(userId: number): Promise<{
    enrolledCourses: number;
    completedCourses: number;
    hoursLearned: number;
    averageScore: number;
  }> {
    const enrollments = await this.getEnrollmentsByUser(userId);
    const testResults = await this.getTestResultsByUser(userId);
    
    const enrolledCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => (e.progress || 0) === 100).length;
    
    let totalHours = 0;
    for (const enrollment of enrollments) {
      const course = await this.getCourse(enrollment.courseId);
      if (course) {
        const progress = enrollment.progress || 0;
        totalHours += Math.floor((course.duration * progress) / 100);
      }
    }

    const averageScore = testResults.length > 0 
      ? Math.round(testResults.reduce((sum, result) => sum + (result.score / result.maxScore * 100), 0) / testResults.length)
      : 0;

    return {
      enrolledCourses,
      completedCourses,
      hoursLearned: totalHours,
      averageScore,
    };
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeCourses: number;
    testsCompleted: number;
    averageScore: number;
  }> {
    const users = await this.getAllUsers();
    const courses = await this.getAllCourses();
    const testResults = Array.from(this.testResults.values());
    
    const totalUsers = users.filter(u => u.role === "student").length;
    const activeCourses = courses.length;
    const testsCompleted = testResults.length;
    const averageScore = testResults.length > 0
      ? Math.round(testResults.reduce((sum, result) => sum + (result.score / result.maxScore * 100), 0) / testResults.length * 10) / 10
      : 0;

    return {
      totalUsers,
      activeCourses,
      testsCompleted,
      averageScore,
    };
  }
}

export const storage = new MemStorage();
