import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, Mail, CheckCircle, Clock, RotateCcw } from "lucide-react";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const form = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    // Get user info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    const emailParam = urlParams.get('email');
    
    if (userIdParam && emailParam) {
      setUserId(userIdParam);
      setEmail(emailParam);
    } else {
      // Redirect to auth page if no verification data
      setLocation("/auth");
    }
  }, [setLocation]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: OTPFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mongo/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          otp: data.otp,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your account is now pending admin approval.",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation("/auth");
        }, 3000);
      } else {
        toast({
          title: "Verification failed",
          description: result.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/mongo/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Code sent!",
          description: "A new verification code has been sent to your email.",
        });
        setCountdown(60); // 60 second cooldown
        form.reset();
      } else {
        toast({
          title: "Failed to resend",
          description: result.message || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md">
          <Card className="relative bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Email Verified!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Your account is now pending admin approval
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-gray-600 mb-4">
                You'll receive an email notification once your account is approved.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Card className="relative bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              We've sent a verification code to
            </CardDescription>
            <p className="font-medium text-violet-600">{email}</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter 6-digit verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="h-14 text-center text-2xl font-mono tracking-widest rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-400 focus:ring-violet-400/20"
                  {...form.register("otp")}
                  autoComplete="one-time-code"
                />
                {form.formState.errors.otp && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">!</span>
                    {form.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={isResending || countdown > 0}
                className="text-violet-600 border-violet-200 hover:bg-violet-50"
              >
                {isResending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : countdown > 0 ? (
                  <Clock className="mr-2 h-4 w-4" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                The verification code will expire in 10 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}