import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  profileImageUrl?: string;
  isApproved?: boolean;
  approvedCourses?: string[];
}

export function useAuth() {
  // Try email/password auth first
  const token = localStorage.getItem("token");
  
  const { data: mongoUser, isLoading: isMongoLoading } = useQuery({
    queryKey: ["/api/mongo/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch("/api/mongo/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
        }
        return null;
      }
      
      return response.json();
    },
    retry: false,
  });

  // Fallback to Replit auth if no token
  const { data: replitUser, isLoading: isReplitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (token) return null; // Skip if we have a token
      
      const response = await fetch("/api/mongo/auth/user", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const user = mongoUser || replitUser;
  const isLoading = isMongoLoading || isReplitLoading;

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
  };
}