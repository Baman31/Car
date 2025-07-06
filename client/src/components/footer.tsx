import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-primary mb-4">EduPlatform</h3>
            <p className="text-gray-600 text-sm">
              Empowering learners with quality education and comprehensive learning management tools.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/courses" className="hover:text-primary">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/test-results" className="hover:text-primary">
                  Test Results
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Progress Tracking</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Certificates</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-primary">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">System Status</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Documentation</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-primary">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Cookie Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">GDPR</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; 2024 EduPlatform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
