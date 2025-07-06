import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Award, Users, Play, Rocket, Star, ArrowRight, TrendingUp, Target, Brain, Zap, ChevronRight, Check, Shield, Clock, Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-64 h-64 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-25 animate-pulse"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-white rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-yellow-400 rounded-full opacity-80 animate-float animation-delay-1000"></div>
        <div className="absolute top-60 left-20 w-3 h-3 bg-purple-400 rounded-full opacity-70 animate-float animation-delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Header Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setLocation('/')}>
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xl">EduPlatform</span>
            <span className="text-purple-300 text-xs">Learn. Grow. Succeed.</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="text-white border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
            onClick={() => setLocation('/auth')}
          >
            Login
          </Button>
          <Button 
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
            onClick={() => setLocation('/auth')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-8 pt-20 pb-24">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10 mb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="flex items-center space-x-2 mb-6">
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-none px-4 py-2">
                  <Star className="w-4 h-4 mr-1" />
                  #1 Learning Platform
                </Badge>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                Master New
                <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Skills Today
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
                Join over 10,000+ learners worldwide. Access expert-led courses, earn certificates, and advance your career with our comprehensive learning platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl transition-all duration-200 hover:shadow-purple-500/25"
                  onClick={() => setLocation('/auth')}
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Learning Now
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 pt-8">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                      +10K
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm">Trusted by learners</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-slate-300 text-sm">4.9/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right Content - Enhanced Hero Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 rounded-3xl opacity-30 blur-3xl transform rotate-6 animate-pulse"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-center">
                      <BookOpen className="w-8 h-8 text-white mx-auto mb-2" />
                      <div className="text-white font-bold text-lg">1,000+</div>
                      <div className="text-purple-100 text-sm">Courses</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-center">
                      <Users className="w-8 h-8 text-white mx-auto mb-2" />
                      <div className="text-white font-bold text-lg">10K+</div>
                      <div className="text-blue-100 text-sm">Students</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-center">
                      <Award className="w-8 h-8 text-white mx-auto mb-2" />
                      <div className="text-white font-bold text-lg">500+</div>
                      <div className="text-green-100 text-sm">Certificates</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-4 text-center">
                      <Target className="w-8 h-8 text-white mx-auto mb-2" />
                      <div className="text-white font-bold text-lg">95%</div>
                      <div className="text-yellow-100 text-sm">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <GraduationCap className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Start Your Journey</h3>
                    <p className="text-slate-300">Transform your skills with expert guidance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose EduPlatform?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Experience the future of learning with our cutting-edge platform designed for success
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm border border-violet-300/30 hover:bg-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">AI-Powered Learning</h3>
                <p className="text-slate-300 leading-relaxed">
                  Personalized learning paths powered by AI that adapts to your pace and style
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm border border-cyan-300/30 hover:bg-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Learn Anytime</h3>
                <p className="text-slate-300 leading-relaxed">
                  Access courses 24/7 from anywhere with our mobile-friendly platform
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-300/30 hover:bg-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Certified Learning</h3>
                <p className="text-slate-300 leading-relaxed">
                  Earn industry-recognized certificates to boost your career prospects
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm border border-yellow-300/30 hover:bg-yellow-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Expert Instructors</h3>
                <p className="text-slate-300 leading-relaxed">
                  Learn from industry experts with real-world experience and proven track records
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500/20 to-rose-600/20 backdrop-blur-sm border border-pink-300/30 hover:bg-pink-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Secure & Reliable</h3>
                <p className="text-slate-300 leading-relaxed">
                  Your data is protected with enterprise-grade security and 99.9% uptime
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-sm border border-purple-300/30 hover:bg-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Global Community</h3>
                <p className="text-slate-300 leading-relaxed">
                  Join a worldwide community of learners and expand your network
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Future?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful learners who have advanced their careers with EduPlatform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl transition-all duration-200 hover:shadow-purple-500/25"
                onClick={() => setLocation('/auth')}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}