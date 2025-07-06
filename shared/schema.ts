import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("student"), // student, instructor, admin
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: integer("duration").notNull(), // in hours
  videoCount: integer("video_count").notNull(),
  instructorId: integer("instructor_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  duration: integer("duration").notNull(), // in minutes
  orderIndex: integer("order_index").notNull(),
  isCompleted: boolean("is_completed").default(false),
});

export const courseNotes = pgTable("course_notes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size").notNull(),
  downloadUrl: text("download_url").notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0), // percentage
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  maxScore: integer("max_score").notNull(),
  timeLimit: integer("time_limit"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  grade: text("grade").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const recentActivities = pgTable("recent_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // completed_video, scored_test, downloaded_notes
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
});

export const insertCourseNoteSchema = createInsertSchema(courseNotes).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  completedAt: true,
});

export const insertRecentActivitySchema = createInsertSchema(recentActivities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

export type CourseNote = typeof courseNotes.$inferSelect;
export type InsertCourseNote = z.infer<typeof insertCourseNoteSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type RecentActivity = typeof recentActivities.$inferSelect;
export type InsertRecentActivity = z.infer<typeof insertRecentActivitySchema>;
