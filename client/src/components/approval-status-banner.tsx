import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ApprovalStatusBanner() {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return null;
  }

  if (!user.isApproved) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Account Pending Approval</strong>
              <p className="text-sm mt-1">
                Your account is awaiting admin approval. You'll be notified once you can access courses.
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (user.approvedCourses && user.approvedCourses.length > 0) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Account Approved</strong>
              <p className="text-sm mt-1">
                You have access to {user.approvedCourses.length} course(s). Start learning!
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <CheckCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Account Approved</strong>
            <p className="text-sm mt-1">
              Your account is approved. Contact admin to get access to specific courses.
            </p>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}