import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PollPresenter from "./PollPresenter";

interface Question {
  id: string;
  type: 'multiple_choice' | 'word_cloud' | 'rating' | 'open_ended';
  question_text: string;
  options?: string[];
  order_index: number;
}

interface PresentationCreatorProps {
  onBack: () => void;
}

const PresentationCreator = ({ onBack }: PresentationCreatorProps) => {
  const [presentationTitle, setPresentationTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});
  const [isPresenting, setIsPresenting] = useState(false);
  const [pollCode, setPollCode] = useState("");
  const [presentationId, setPresentationId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const addQuestion = () => {
    if (!newQuestion.question_text || !newQuestion.type) {
      toast({
        title: "Missing Information",
        description: "Please provide a question text and select a type.",
        variant: "destructive",
      });
      return;
    }

    const question: Question = {
      id: Date.now().toString(),
      type: newQuestion.type as Question['type'],
      question_text: newQuestion.question_text,
      options: newQuestion.type === 'multiple_choice' ? newQuestion.options || [] : undefined,
      order_index: questions.length,
    };

    setQuestions([...questions, question]);
    setNewQuestion({});
    toast({
      title: "Question Added",
      description: "Your question has been added to the presentation."
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startPresentation = async () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question before starting the presentation.",
        variant: "destructive",
      });
      return;
    }

    if (!user){
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a presentation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try{
      // Generate access code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_access_code');

      if (codeError) throw codeError;

      // Create presentation
      const { data: presentation, error: presentationError } = await supabase
        .from('presentations')
        .insert({
          title: presentationTitle || "Untitled Presentation",
          user_id: user.id,
          access_code: codeData,
          is_active: true,
        })
        .select()
        .single();

      if (presentationError) throw presentationError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        presentation_id: presentation.id,
        question_text: q.question_text,
        question_type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        order_index: q.order_index,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setPollCode(codeData);
      setPresentationId(presentation.id);
      setIsPresenting(true);  

      toast({
        title: "Presentation Started!",
        description: `Share code ${codeData} with your audience`
      });
    } catch (error: any) {
      toast({
        title: "Error Starting Presentation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isPresenting) {
    return (
      <PollPresenter
        presentationId={presentationId}
        pollCode={pollCode}
        onBack={() => setIsPresenting(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">Create Presentation</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Presentation Setup */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Presentation Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Presentation Title</Label>
                  <Input
                    id="title"
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    placeholder="Enter presentation title..."
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Add New Question</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Question Type</Label>
                  <Select value={newQuestion.type} onValueChange={(value) => setNewQuestion({...newQuestion, type: value as Question['type']})}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="word_cloud">Word Cloud</SelectItem>
                      <SelectItem value="rating">Rating Scale</SelectItem>
                      <SelectItem value="open_ended">Open Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Question Text</Label>
                  <Input
                    value={newQuestion.question_text || ""}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="Enter your question..."
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>

                {newQuestion.type === 'multiple_choice' && (
                  <div>
                    <Label className="text-white">Options (one per line)</Label>
                    <Textarea
                      value={newQuestion.options?.join('\n') || ""}
                      onChange={(e) => setNewQuestion({...newQuestion, options: e.target.value.split('\n').filter(o => o.trim())})}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                )}

                <Button onClick={addQuestion} className="bg-yellow-400 text-purple-600 hover:bg-yellow-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Question List */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Questions ({questions.length})</h2>
                <Button 
                  onClick={startPresentation}
                  className="bg-green-500 text-white hover:bg-green-400"
                  disabled={questions.length === 0 || loading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loading ? 'Starting...' : 'Start Presentation'}
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <Card key={question.id} className="bg-white/10 border-white/20 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-yellow-400 text-purple-600 text-xs font-bold px-2 py-1 rounded">
                            Q{index + 1}
                          </span>
                          <span className="text-xs text-white/70 capitalize">
                            {question.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-white font-medium">{question.question_text}</p>
                        {question.options && (
                          <div className="mt-2">
                            {question.options.map((option, i) => (
                              <div key={i} className="text-sm text-white/70">• {option}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-white/60 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No questions added yet. Create your first question to get started!
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationCreator;