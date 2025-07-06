import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const setupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function AccountSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check if user is authenticated via Replit and get their info
  useEffect(() => {
    const checkReplitAuth = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const user = await response.json();
          setUserInfo(user);
          
          // Check if user already has username/password setup
          const mongoCheckResponse = await fetch("/api/mongo/auth/check-setup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
          });
          
          if (mongoCheckResponse.ok) {
            const { hasSetup } = await mongoCheckResponse.json();
            if (hasSetup) {
              // User already has setup, redirect to dashboard
              setLocation("/");
              return;
            }
          }
        } else {
          // Not authenticated via Replit, redirect to login
          window.location.href = "/api/login";
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        window.location.href = "/api/login";
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkReplitAuth();
  }, [setLocation]);

  const onSubmit = async (data: SetupFormData) => {
    if (!userInfo) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mongo/auth/complete-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInfo.email,
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          username: data.username,
          password: data.password,
          replitId: userInfo.id,
          profileImageUrl: userInfo.profileImageUrl,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("token", result.token);
        toast({
          title: "Account setup complete",
          description: "Welcome to EduPlatform! Your account is pending approval.",
        });
        setLocation("/");
      } else {
        toast({
          title: "Setup failed",
          description: result.message || "Failed to complete account setup",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>
                Complete your account setup to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-1">
                    <p><strong>Email:</strong> {userInfo.email}</p>
                    {userInfo.firstName && (
                      <p><strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Choose a Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Create a Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <User className="mr-2 h-4 w-4" />
                  Complete Account Setup
                </Button>
              </form>

              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Your account will require admin approval before you can access courses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}