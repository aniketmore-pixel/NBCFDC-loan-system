import { useState } from "react";
import { MessageCircle, X, Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export const HelpChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your NBCFDC assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const quickQuestions = [
    "How do I apply for a loan?",
    "What is credit score?",
    "How to complete my profile?",
    "Track my application",
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);

    setInputValue("");
  };

  const getBotResponse = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("apply") || lowerQuestion.includes("loan")) {
      return "To apply for a loan, complete your profile first. Go to 'Complete Profile' section and fill all required forms. Once done, you can apply for a loan based on your eligibility.";
    } else if (lowerQuestion.includes("credit score")) {
      return "Your credit score is calculated based on repayment behavior, income stability, bill payment patterns, and document verification. Complete your profile to improve your score.";
    } else if (lowerQuestion.includes("profile") || lowerQuestion.includes("complete")) {
      return "Navigate to the 'Complete Profile' section in your dashboard. Fill out Basic Details, Income Details, Bank Details, Expenses & Commodities, and Submit Documents forms.";
    } else if (lowerQuestion.includes("track")) {
      return "You can track your loan application status in the 'Track Application' section. It shows detailed progress, approval/rejection reasons, and timeline.";
    } else if (lowerQuestion.includes("contact") || lowerQuestion.includes("call") || lowerQuestion.includes("help")) {
      return "You can reach us at:\n📞 Toll-Free: 1800-XXX-XXXX\n📧 Email: support@nbcfdc.gov.in\n🕒 Working Hours: Mon-Fri, 9 AM - 6 PM";
    } else {
      return "I'm here to help! You can ask me about loan applications, credit scores, profile completion, or tracking your application. For specific queries, please contact our support team.";
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    handleSend();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-elevated z-50"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              NBCFDC Help Assistant
            </SheetTitle>
            <SheetDescription>
              Get instant help with your loan application and queries
            </SheetDescription>
          </SheetHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-muted-foreground">Quick questions:</p>
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Contact Options */}
          <div className="p-4 border-t border-b bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Need direct assistance?</p>
            <Button variant="outline" size="sm" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Call Support: 1800-XXX-XXXX
            </Button>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
