import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Users, BarChart3, Zap, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PresentationCreator from "@/components/PresentationCreator";
import PollParticipant from "@/components/PollParticipant";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'create' | 'join'>('home');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  if (currentView === 'create') {
    if (!user) {
      navigate('/auth');
      return null;
    }
    return <PresentationCreator onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'join'){
    return <PollParticipant onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">
              Menti<span className="text-yellow-300">Live</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="border-white text-white hover:bg-white hover:text-purple-600"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
            Menti<span className="text-yellow-300">Live</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Create interactive presentations and engage your audience with live polls, 
            quizzes, and real-time feedback
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => user ? setCurrentView('create') : navigate('/auth')}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Presentation
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentView('join')}
            >
              <Users className="mr-2 h-5 w-5" />
              Join with Code
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="bg-yellow-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Live Results</h3>
            <p className="text-white/80">See responses update in real-time with beautiful visualizations</p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="bg-green-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Easy Participation</h3>
            <p className="text-white/80">Audience joins instantly with a simple code - no downloads required</p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="bg-pink-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Multiple Formats</h3>
            <p className="text-white/80">Multiple choice, word clouds, scales, and open-ended questions</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;