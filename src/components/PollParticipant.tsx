import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PollParticipantProps {
  onBack: () => void;
}

const PollParticipant = ({ onBack }: PollParticipantProps) => {
  const [pollcode, setPollCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [CurrentlQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const { toast } = useToast();

  // Mock questions for demonstration
  const mockQuestions = [
    {
      id: "1",
      type: "multiple-choice" as const,
      title: "What's your favorite programming language?",
      options: ["JavaScript", "Python", "Java", "C++", "Go"]
    },
    {
      id: "2",
      type: "scale" as const,
      title: "How satisfied are you with this presentation?",
      scaleMin: 1,
      scaleMax: 10
    },
    {
      id: "3",
      type: "word-cloud" as const,
      title: "Describe this session in one word:"
    }
    {
      id: "4",
      type: "open-text" as const,
      title: "Any suggestions for improvement?"
    }
  ];

  const joinPoll = () => {
    if (pollcode.length < 4) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid poll code",
        variant: "destructive"
      });
      return;
    }

    setIsJoined(true);
    toast({
      title: "Joined successfully!",
      description: "You've joined the live poll!"
    });
  };

  const submitAnswer = () => {
    const question = mockQuestions[currentQuestion];

    if (question.type === 'open-text' || question.type === 'word-cloud') {
      if (!textAnswer.trim()) {
        toast({
          title: "Answer Required",
          description: "Please provide an answer",
          variant: "destructive"
        });
        return;
      }
    } else if (selectedAnswer === null) {
      toast({
        title: "Answer Required",
        description: "Please select an answer",
        variant: "destructive"
      })
      return;
    }

    setHasAnswered(true);
    toast({
      title: "Answer Submitted!",
      description: "Thank you for your response"
    });

    // Auto advance to the next question after 2 seconds
    setTimeout(() => {
      if (currentQuestion < mockQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTextAnswer("");
        setHasAnswered(false);
    }
  }, 2000);
};

if (!isJoined) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back 
              </Button>
              <h1 className="text-3xl font-bold text-white mb-2">Join Live Poll</h1>
            <p className="text-white/80">Enter the code shared by your presenter</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="code" className="text-white text-lg">Poll Code</Label>
              <Input
                id="code"
                value={pollCode}
                onChange={(e) => setPollCode(e.target.value.toUpperCase())}
                placeholder="Enter code to enter"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 text-center text-2xl font-bold h-16 mt-2"
                maxLength={8}
              />
            </div>

            <Button 
              onClick={joinPoll} 
              className="w-full bg-yellow-400 text-purple-600 hover:bg-yellow-300 text-lg py-4 font-semibold"
            >
              Join Poll
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = mockQuestions[currentQuestion];

  return(
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
    <div className="container mx-auto max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge className="bg-yellow-400 text-purple-600 px-4 py-2">
            Poll Code: {pollCode}
          </Badge>
          <Badge variant="outline" className="border-white text-white">
            Question {currentQuestion + 1} of {mockQuestions.length}
          </Badge>
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
          {hasAnswered ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Answer Submitted!</h2>
              <p className="text-white/80">
                {currentQuestion < mockQuestions.length - 1 
                  ? "Moving to next question..." 
                  : "Thank you for participating!"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Badge variant="outline" className="border-white text-white capitalize mb-4">
                  {question.type.replace('-', ' ')}
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {question.title}
                </h2>
              </div>

              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-3 mb-8">
                  {question.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === option ? "default" : "outline"}
                      className={`w-full p-6 text-left justify-start text-lg ${
                        selectedAnswer === option 
                          ? "bg-yellow-400 text-purple-600 hover:bg-yellow-300" 
                          : "border-white text-white hover:bg-white hover:text-purple-600"
                      }`}
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {question.type === 'scale' && (
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <p className="text-white/80 mb-4">Select a rating from 1 to 10</p>
                    <div className="grid grid-cols-5 gap-3">
                      {Array.from({length: 10}, (_, i) => i + 1).map((num) => (
                        <Button
                          key={num}
                          variant={selectedAnswer === num ? "default" : "outline"}
                          className={`aspect-square text-xl font-bold ${
                            selectedAnswer === num 
                              ? "bg-yellow-400 text-purple-600 hover:bg-yellow-300" 
                              : "border-white text-white hover:bg-white hover:text-purple-600"
                          }`}
                          onClick={() => setSelectedAnswer(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(question.type === 'word-cloud' || question.type === 'open-text') && (
                <div className="mb-8">
                  <Label className="text-white text-lg mb-4 block">Your Answer</Label>
                  {question.type === 'word-cloud' ? (
                    <Input
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Enter one word..."
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60 text-xl h-16"
                    />
                  ) : (
                    <Textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Enter your response..."
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60 min-h-32"
                    />
                  )}
                </div>
              )}

              <Button 
                onClick={submitAnswer}
                className="w-full bg-green-500 text-white hover:bg-green-400 text-lg py-4 font-semibold"
              >
                <Send className="h-5 w-5 mr-2" />
                Submit Answer
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PollParticipant;
  