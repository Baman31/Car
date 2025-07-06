import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Using MongoDB models instead of shared schema
import { z } from "zod";
import mongoRoutes from "./routes/mongoRoutes.js";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (will skip OAuth for local development)
  await setupAuth(app);

  // Auth routes for user info
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user?.dbUser;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl || user.avatar,
        isApproved: user.isApproved,
        enrolledCourses: user.enrolledCourses || [],
        isActive: user.isActive
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Add MongoDB routes - auth routes need to be accessible without middleware
  app.use('/api/mongo', mongoRoutes);
  
  // Legacy routes (keeping for backward compatibility)
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const { category } = req.query;
      let courses;
      
      if (category && typeof category === "string") {
        courses = await storage.getCoursesByCategory(category);
      } else {
        courses = await storage.getAllCourses();
      }
      
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(courseId, courseData);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const success = await storage.deleteCourse(courseId);
      
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Course modules routes
  app.get("/api/courses/:id/modules", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });

  // Course notes routes
  app.get("/api/courses/:id/notes", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const notes = await storage.getCourseNotes(courseId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course notes" });
    }
  });

  // Enrollment routes
  app.get("/api/users/:id/enrollments", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const enrollments = await storage.getEnrollmentsByUser(userId);
      
      // Get course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );
      
      res.json(enrollmentsWithCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const { userId, courseId } = req.body;
      const enrollment = await storage.createEnrollment({ userId, courseId, progress: 0 });
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.put("/api/enrollments/:userId/:courseId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      const { progress } = req.body;
      
      const enrollment = await storage.updateEnrollmentProgress(userId, courseId, progress);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Test routes
  app.get("/api/courses/:id/tests", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const tests = await storage.getTestsByCourse(courseId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const testData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  // Test results routes
  app.get("/api/users/:id/test-results", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const results = await storage.getTestResultsByUser(userId);
      
      // Get test and course details for each result
      const resultsWithDetails = await Promise.all(
        results.map(async (result) => {
          const test = await storage.getTest(result.testId);
          const course = test ? await storage.getCourse(test.courseId) : null;
          return { ...result, test, course };
        })
      );
      
      res.json(resultsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test results" });
    }
  });

  app.post("/api/test-results", async (req, res) => {
    try {
      const resultData = insertTestResultSchema.parse(req.body);
      const result = await storage.createTestResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test result data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test result" });
    }
  });

  // Recent activities routes
  app.get("/api/users/:id/activities", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivitiesByUser(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Admin stats routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // File download routes (mock)
  app.get("/api/notes/download/:id", (req, res) => {
    // Mock PDF download - in real app would serve actual files
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="note-${req.params.id}.pdf"`);
    res.send("Mock PDF content");
  });

  // Mount MongoDB routes
  // Removed legacy MongoDB routes

  const httpServer = createServer(app);
  return httpServer;
}
