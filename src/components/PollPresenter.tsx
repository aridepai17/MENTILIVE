
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, ArrowLeft as PrevIcon, Users, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_type: 'multiple_choice' | 'word_cloud' | 'rating' | 'open_ended';
  question_text: string;
  options?: string[];
  order_index: number;
}

interface PollPresenterProps {
  presentationId: string;
  pollCode: string;
  onBack: () => void;
}

const PollPresenter = ({ presentationId, pollCode, onBack }: PollPresenterProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{[questionId: string]: any[]}>({});
  const [participantCount, setParticipantCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];

  // Fetch questions for the presentation
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('presentation_id', presentationId)
          .order('order_index');

        if (error) throw error;

        const formattedQuestions: Question[] = data.map(q => ({
          id: q.id,
          question_type: q.question_type as Question['question_type'],
          question_text: q.question_text,
          options: q.options ? JSON.parse(q.options as string) : undefined,
          order_index: q.order_index
        }));

        setQuestions(formattedQuestions);
      } catch (error: any) {
        toast({
          title: "Error Loading Questions",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [presentationId, toast]);

  // Set up real-time subscription for responses
  useEffect(() => {
    if (questions.length === 0) return;

    const questionIds = questions.map(q => q.id);
    
    const channel = supabase
      .channel('responses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `question_id=in.(${questionIds.join(',')})`
        },
        (payload) => {
          const newResponse = payload.new;
          setResponses(prev => {
            const updated = { ...prev };
            if (!updated[newResponse.question_id]) {
              updated[newResponse.question_id] = [];
            }
            updated[newResponse.question_id].push(newResponse.response_data);
            return updated;
          });
          
          // Update participant count
          setParticipantCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questions]);

  // Fetch existing responses
  useEffect(() => {
    if (questions.length === 0) return;

    const fetchResponses = async () => {
      const questionIds = questions.map(q => q.id);
      
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .in('question_id', questionIds);

      if (error) {
        console.error('Error fetching responses:', error);
        return;
      }

      const groupedResponses: {[questionId: string]: any[]} = {};
      data.forEach(response => {
        if (!groupedResponses[response.question_id]) {
          groupedResponses[response.question_id] = [];
        }
        groupedResponses[response.question_id].push(response.response_data);
      });

      setResponses(groupedResponses);
      setParticipantCount(data.length);
    };

    fetchResponses();
  }, [questions]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getChartData = () => {
    if (!currentQuestion) return [];
    
    const questionResponses = responses[currentQuestion.id] || [];
    
    if (currentQuestion.question_type === 'multiple_choice') {
      const counts: {[key: string]: number} = {};
      currentQuestion.options?.forEach(option => {
        counts[option] = questionResponses.filter(r => r === option).length;
      });
      
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } else if (currentQuestion.question_type === 'rating') {
      const counts: {[key: number]: number} = {};
      for (let i = 1; i <= 10; i++) {
        counts[i] = questionResponses.filter(r => r === i).length;
      }
      
      return Object.entries(counts).map(([name, value]) => ({ name, value: Number(value) }));
    }
    
    return [];
  };

  const getWordCloudData = () => {
    if (!currentQuestion) return [];
    
    const questionResponses = responses[currentQuestion.id] || [];
    const counts: {[key: string]: number} = {};
    
    questionResponses.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f5930b', '#ef4444', '#6366f1', '#84cc16'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading presentation...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-xl">No questions found for this presentation.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-white">Presentation Mode</h1>
          </div>

          <div className="flex items-center gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-4 py-2">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{participantCount}</span>
                <span className="text-sm">participants</span>
              </div>
            </Card>
            
            <Card className="bg-yellow-400 px-6 py-2">
              <div className="text-center">
                <div className="text-purple-600 text-sm font-medium">Join Code</div>
                <div className="text-purple-800 text-2xl font-bold">{pollCode}</div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Current Question */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="secondary" className="bg-yellow-400 text-purple-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Badge variant="outline" className="border-white text-white capitalize">
                  {currentQuestion.question_type.replace('_', ' ')}
                </Badge>
              </div>

              <h2 className="text-3xl font-bold text-white mb-8">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="bg-white/20 rounded-lg p-4 text-white font-medium">
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'rating' && (
                <div className="text-center">
                  <div className="flex justify-between items-center bg-white/20 rounded-lg p-4 mb-4">
                    <span className="text-white font-bold text-2xl">1</span>
                    <div className="flex gap-2">
                      {Array.from({length: 10}, (_, i) => (
                        <div key={i} className="w-8 h-8 bg-white/30 rounded-full"></div>
                      ))}
                    </div>
                    <span className="text-white font-bold text-2xl">10</span>
                  </div>
                  <p className="text-white/80">Rate from 1 to 10</p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                >
                  <PrevIcon className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-yellow-400 text-purple-600 hover:bg-yellow-300"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Live Results */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-white" />
                <h3 className="text-xl font-semibold text-white">Live Results</h3>
                <Badge className="bg-green-500 text-white animate-pulse">
                  Live
                </Badge>
              </div>

              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                      <XAxis dataKey="name" stroke="white" fontSize={12} />
                      <YAxis stroke="white" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.9)', 
                          border: 'none', 
                          borderRadius: '8px' 
                        }} 
                      />
                      <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {currentQuestion.question_type === 'rating' && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                      <XAxis dataKey="name" stroke="white" fontSize={12} />
                      <YAxis stroke="white" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.9)', 
                          border: 'none', 
                          borderRadius: '8px' 
                        }} 
                      />
                      <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {currentQuestion.question_type === 'word_cloud' && (
                <div className="space-y-3">
                  {getWordCloudData().map((item, index) => (
                    <div key={item.word} className="flex items-center justify-between bg-white/20 rounded p-3">
                      <span className="text-white font-medium" style={{fontSize: `${Math.max(14, item.count * 2)}px`}}>
                        {item.word}
                      </span>
                      <Badge className="bg-yellow-400 text-purple-600">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'open_ended' && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(responses[currentQuestion.id] || []).map((response, index) => (
                    <Card key={index} className="bg-white/20 border-white/30 p-3">
                      <p className="text-white">{response}</p>
                    </Card>
                  ))}
                  {(responses[currentQuestion.id] || []).length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      Waiting for responses...
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-white/80 text-sm">
                  {(responses[currentQuestion.id] || []).length} responses received
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPresenter;
