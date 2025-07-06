import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
}

export function getProgressColor(progress: number): string {
  if (progress === 100) return "bg-green-600";
  if (progress >= 50) return "bg-primary-600";
  return "bg-yellow-500";
}

export function getGradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'A+':
    case 'A':
      return 'grade-a';
    case 'B+':
    case 'B':
      return 'grade-b';
    case 'C+':
    case 'C':
      return 'grade-c';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'status-active';
    case 'completed':
      return 'status-completed';
    case 'in progress':
      return 'status-in-progress';
    case 'not started':
      return 'status-not-started';
    default:
      return 'status-inactive';
  }
}

export function getActivityIcon(type: string): string {
  switch (type) {
    case 'completed_video':
      return 'fas fa-play';
    case 'scored_test':
      return 'fas fa-check';
    case 'downloaded_notes':
      return 'fas fa-download';
    default:
      return 'fas fa-circle';
  }
}

export function getActivityIconColor(type: string): string {
  switch (type) {
    case 'completed_video':
      return 'text-blue-600 bg-blue-100';
    case 'scored_test':
      return 'text-green-600 bg-green-100';
    case 'downloaded_notes':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
