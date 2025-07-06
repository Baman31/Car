import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  Award,
  LogOut
} from "lucide-react";

const getSidebarItems = (userRole: string) => {
  const baseItems = [
    { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
    { icon: BookOpen, label: "My Courses", route: "/courses" },
    { icon: Award, label: "Test Results", route: "/test-results" },
  ];

  if (userRole === 'admin') {
    baseItems.push({ icon: Settings, label: "Admin Panel", route: "/admin" });
  }

  return baseItems;
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const sidebarItems = getSidebarItems(user?.role || 'student');

  const isActive = (route: string) => {
    if (route === "/dashboard" && (location === "/" || location === "/dashboard")) return true;
    if (route !== "/dashboard" && location.startsWith(route)) return true;
    return false;
  };

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (token) {
      localStorage.removeItem("token");
      window.location.href = '/';
    } else {
      window.location.href = '/api/logout';
    }
  };

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800/50">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setLocation('/dashboard')}>
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-50 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap className="w-7 h-7 text-blue-900" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-90 animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent tracking-wide">
              EduPlatform
            </span>
            <span className="text-xs text-blue-300 font-medium tracking-widest opacity-80">
              LEARN • GROW • ACHIEVE
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2 mb-8">
          {sidebarItems.map((item, index) => (
            <li key={index}>
              <button 
                onClick={() => setLocation(item.route)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive(item.route)
                    ? 'bg-blue-800 text-white' 
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}