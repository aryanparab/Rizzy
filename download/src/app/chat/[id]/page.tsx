"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Bot, User, Send, Wand2, Loader2, ArrowLeft, NotebookText, 
  Paintbrush, Heart, MoreVertical, Trash2, Edit3, MessageSquareX,
  Save, X
} from "lucide-react";

import type { Persona, Message, Recommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SuggestionCard } from "@/components/suggestion-card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  sendMessage, 
  getHistory, 
  getSuggestion, 
  fetchPersonaList,
  clearChatHistory,
  deletePersona,
  updatePersona
} from "../../../lib/api";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false); // Add this new state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPersona, setIsLoadingPersona] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  
  // New states for additional features
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    traits: "",
    interests: "",
    writingStyle: "",
    previousChat:""
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  
  // Add refs to track loading state and prevent unnecessary reloads
  const hasLoadedPersona = useRef(false);
  const hasLoadedHistory = useRef(false);
  const currentPersonaId = useRef<string | null>(null);
  
  const personaId = params?.id as string;

  // Memoize personaId to prevent unnecessary re-renders
  const memoizedPersonaId = useMemo(() => personaId, [personaId]);
  const memoizedUserEmail = useMemo(() => session?.user?.email, [session?.user?.email]);

  // Memoize router and toast to prevent unnecessary re-renders
  const memoizedRouter = useMemo(() => router, [router]);
  const memoizedToast = useMemo(() => toast, [toast]);

  // Extract persona traits from system_prompt
  const extractPersonaTraits = useCallback((systemPrompt: string, chatHistory: string = '') => {
    const traits = systemPrompt?.split('Traits: ')[1]?.split(' endTraits')[0] || '';
    const interests = systemPrompt?.split('Interests: ')[1]?.split(' endInterests')[0] || '';
    const writingStyle = systemPrompt?.split('Writing Style: ')[1]?.split(' endWriting')[0] || '';
    // Extract previousChat from chat_history field instead of system_prompt
    const previousChat = chatHistory || '';
    return { traits, interests, writingStyle, previousChat };
  }, []);

  // Reset loading flags when personaId changes
  useEffect(() => {
    if (currentPersonaId.current !== personaId) {
      hasLoadedPersona.current = false;
      hasLoadedHistory.current = false;
      currentPersonaId.current = personaId;
      // Reset states to prevent stale data
      setPersona(null);
      setMessages([]);
      setRecommendations([]);
    }
  }, [personaId]);

  // Cleanup effect
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Fetch persona from backend - Modified to prevent unnecessary reloading
  useEffect(() => {
    // Early returns to prevent unnecessary API calls
    if (!memoizedUserEmail || !memoizedPersonaId) {
      if (status !== "loading") {
        memoizedRouter.push("/");
      }
      return;
    }

    // Prevent reloading if already loaded for this persona
    if (hasLoadedPersona.current && currentPersonaId.current === personaId) {
      return;
    }

    const loadPersona = async () => {
      try {
        setIsLoadingPersona(true);
        const response = await fetchPersonaList(memoizedUserEmail);
        
        // Check if component is still mounted
        if (!mounted.current) return;
        
        const personas = Array.isArray(response) ? response : response.personas || [];
        
        const foundPersona = personas.find((p: Persona) => {
          const personaId_str = String(p?.persona_id || p?._id || p?.id || '');
          const searchId_str = String(memoizedPersonaId);
          
          return personaId_str === searchId_str ||
                 p?.persona_id === memoizedPersonaId ||
                 p?._id === memoizedPersonaId || 
                 p?.id === memoizedPersonaId;
        });
        
        if (foundPersona) {
          setPersona(foundPersona);
          // Initialize edit form with current persona data
          const { traits, interests, writingStyle, previousChat } = extractPersonaTraits(
            foundPersona.system_prompt || '', 
            foundPersona.chat_history || ''
          );
          setEditForm({
            name: foundPersona.name || "",
            description: foundPersona.description || "",
            traits,
            interests,
            writingStyle,
            previousChat
          });
          
          // Mark as successfully loaded
          hasLoadedPersona.current = true;
        } else {
          memoizedToast({
            title: "Persona Not Found",
            description: "The requested persona could not be found.",
            variant: "destructive",
          });
          memoizedRouter.push("/");
        }
      } catch (error) {
        console.error("Failed to load persona:", error);
        hasLoadedPersona.current = false; // Reset on error
        if (mounted.current) {
          memoizedToast({
            title: "Error",
            description: "Could not load persona. Please try again.",
            variant: "destructive",
          });
          memoizedRouter.push("/");
        }
      } finally {
        if (mounted.current) {
          setIsLoadingPersona(false);
        }
      }
    };

    loadPersona();
  }, [memoizedUserEmail, memoizedPersonaId, status, extractPersonaTraits, memoizedRouter, memoizedToast]);

  // Fetch chat history from backend - Modified to prevent unnecessary reloading
  useEffect(() => {
    // Early returns
    if (!memoizedUserEmail || !memoizedPersonaId || !persona || isLoadingPersona) {
      return;
    }

    // Prevent reloading if already loaded for this persona and history
    if (hasLoadedHistory.current && currentPersonaId.current === personaId) {
      return;
    }

    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const history = await getHistory({
          session_id: memoizedUserEmail,
          persona_id: memoizedPersonaId
        });

        if (!mounted.current) return;

        if (history && history.length > 0) {
          const formattedMessages: Message[] = history.map((msg: any, index: number) => ({
            id: (index + 1).toString(),
            role: msg.role,
            content: msg.content,
            avatar: msg.role === "assistant" 
              ? `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}`
              : undefined
          }));
          setMessages(formattedMessages);
        } else {
          setMessages([
            {
              id: "0",
              role: "assistant",
              content: `Hello! I'm ${persona.name}. What's on your mind?`,
              avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}`,
            },
          ]);
        }
        
        // Mark as successfully loaded
        hasLoadedHistory.current = true;
      } catch (error) {
        console.error("Failed to load chat history:", error);
        hasLoadedHistory.current = false; // Reset on error
        if (mounted.current) {
          setMessages([
            {
              id: "0",
              role: "assistant",
              content: `Hello! I'm ${persona.name}. What's on your mind?`,
              avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}`,
            },
          ]);
        }
      } finally {
        if (mounted.current) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistory();
  }, [memoizedUserEmail, memoizedPersonaId, persona?.persona_id, isLoadingPersona]);

  // Debounced auto-scroll effect - optimized to only run when needed
  const debouncedScrollToBottom = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (scrollAreaRef.current && messages.length > 0) {
            const scrollElement = scrollAreaRef.current;
            const isAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 100;
            
            // Only auto-scroll if user is near the bottom
            if (isAtBottom) {
              scrollElement.scrollTo({ 
                top: scrollElement.scrollHeight, 
                behavior: "smooth" 
              });
            }
          }
        }, 100);
      };
    },
    [messages.length]
  );

  useEffect(() => {
    debouncedScrollToBottom();
  }, [messages, debouncedScrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !session?.user?.email || !persona || !personaId) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendMessage({
        session_id: session.user.email,
        persona_id: personaId,
        persona_instructions: persona.chat_history || '',
        message: input
      });

      // Check if component is still mounted before updating state
      if (!mounted.current) return;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}`,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error with API chat:", error);
      if (mounted.current) {
        memoizedToast({
          title: "API Error",
          description: "The backend is having trouble responding. Please try again.",
          variant: "destructive",
        });
        setMessages(newMessages);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleAnalyzeChat = async () => {
  // If recommendations are already showing, hide them
  if (showRecommendations) {
    setShowRecommendations(false);
    return;
  }

  if (isAnalyzing || messages.length < 2 || !session?.user?.email || !persona) {
    memoizedToast({ title: "Not enough context", description: "Send a few more messages before analyzing." });
    return;
  }

  setIsAnalyzing(true);
  setRecommendations([]);

  try {
    const chatHistory = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    
    const result = await getSuggestion({
      chatHistory,
      session_id: session?.user?.email,
      persona_id: personaId
    });

    if (mounted.current) {
      console.log("Analysis result:", result);
      setRecommendations(result["recommendations"] || []);
      setShowRecommendations(true); // Show recommendations after getting them
    }
  } catch (error) {
    console.error("Error with API analysis:", error);
    if (mounted.current) {
      memoizedToast({
        title: "Analysis Error",
        description: "The backend could not provide suggestions at this time.",
        variant: "destructive",
      });
    }
  } finally {
    if (mounted.current) {
      setIsAnalyzing(false);
    }
  }
};
  const handleClearChat = async () => {
    if (!session?.user?.email || !personaId) return;

    setIsClearing(true);
    try {
      await clearChatHistory({
        session_id: session.user.email,
        persona_id: personaId
      });

      if (mounted.current) {
        // Reset messages to initial greeting
        setMessages([
          {
            id: "0",
            role: "assistant",
            content: `Hello! I'm ${persona?.name}. What's on your mind?`,
            avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona?.name || '')}`,
          },
        ]);

        memoizedToast({
          title: "Chat Cleared",
          description: "Chat history has been successfully cleared.",
        });
      }
    } catch (error) {
      console.error("Failed to clear chat:", error);
      if (mounted.current) {
        memoizedToast({
          title: "Error",
          description: "Failed to clear chat history. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (mounted.current) {
        setIsClearing(false);
        setShowClearDialog(false);
      }
    }
  };

  const handleDeletePersona = async () => {
    if (!session?.user?.email || !personaId) return;

    setIsDeleting(true);
    try {
      await deletePersona({
        userId: session.user.email,
        persona_id: personaId
      });

      if (mounted.current) {
        memoizedToast({
          title: "Persona Deleted",
          description: "Persona has been successfully deleted.",
        });

        memoizedRouter.push("/");
      }
    } catch (error) {
      console.error("Failed to delete persona:", error);
      if (mounted.current) {
        memoizedToast({
          title: "Error",
          description: "Failed to delete persona. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (mounted.current) {
        setIsDeleting(false);
        setShowDeleteDialog(false);
      }
    }
  };

  const handleUpdatePersona = async () => {
    if (!session?.user?.email || !personaId) return;

    setIsUpdating(true);
    try {
      await updatePersona({
        persona_id: personaId,
        userId: session.user.email,
        name: editForm.name,
        description: editForm.description,
        traits: editForm.traits,
        interests: editForm.interests,
        writingStyle: editForm.writingStyle,
        previousChat: editForm.previousChat
      });

      if (mounted.current) {
        // Update local persona state
        if (persona) {
          const updatedPersona = {
            ...persona,
            name: editForm.name,
            description: editForm.description,
            system_prompt: `Traits: ${editForm.traits} endTraits,Interests: ${editForm.interests} endInterests,Writing Style: ${editForm.writingStyle} endWriting`,
            chat_history: editForm.previousChat
          };
          setPersona(updatedPersona);
        }

        memoizedToast({
          title: "Persona Updated",
          description: "Persona has been successfully updated.",
        });

        setShowEditDialog(false);
      }
    } catch (error) {
      console.error("Failed to update persona:", error);
      if (mounted.current) {
        memoizedToast({
          title: "Error",
          description: "Failed to update persona. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (mounted.current) {
        setIsUpdating(false);
      }
    }
  };

  // Show loading spinner while session is loading
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to home if no session
  if (!session) {
    memoizedRouter.push("/");
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show loading while persona is being fetched
  if (isLoadingPersona || !persona) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { traits, interests, writingStyle } = extractPersonaTraits(persona.system_prompt || '');

  // Add this component before the main ChatPage component
const RatingDisplay = ({ recommendation }: { recommendation: Recommendation }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-500";
    if (rating >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRatingEmoji = (rating: number) => {
    if (rating >= 4) return "😊";
    if (rating >= 3) return "😐";
    return "😔";
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 px-2 text-xs font-medium text-white border-none",
          getRatingColor(recommendation.rating)
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getRatingEmoji(recommendation.rating)} {recommendation.rating}/5
      </Button>
      
      {showDetails && (
        <div className="absolute right-0 top-10 z-10 w-80 p-3 bg-popover border rounded-lg shadow-lg">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-blue-600">💡 Suggestion:</span>
              <p className="text-muted-foreground mt-1">{recommendation.suggestion}</p>
            </div>
            <div>
              <span className="font-semibold text-green-600">➡️ Next Move:</span>
              <p className="text-muted-foreground mt-1">{recommendation.next_move}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="flex h-screen flex-col md:flex-row bg-muted/30 dark:bg-muted/10">
      <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 flex flex-col border-b md:border-b-0 md:border-r bg-card">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => memoizedRouter.push('/')}>
              <ArrowLeft />
            </Button>
            <h1 className="font-headline text-2xl font-bold">Alter Ego</h1>
          </div>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Persona
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                <MessageSquareX className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Persona
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Separator />
        
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            <div className="text-center space-y-2">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20 shadow-lg">
                <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}&radius=30`} alt={persona.name} />
                <AvatarFallback>{persona.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{persona.name}</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Bot size={18} /> Personality</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                    <NotebookText size={16} /> Traits
                  </h4>
                  <p>{traits || 'No traits specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Heart size={16} /> Interests
                  </h4>
                  <p>{interests || 'No interests specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Paintbrush size={16} /> Writing Style
                  </h4>
                  <p>{writingStyle || 'No writing style specified'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => memoizedRouter.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
          <div 
            className="max-w-4xl mx-auto w-full space-y-6"
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
          >
            {isLoadingHistory ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-end gap-3 justify-start">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-12 w-64 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : (
              messages.map((message, index) => {
  // Find recommendation for this user message
  const recommendation = recommendations.find(
    (rec) => rec.message_index === index && message.role === "user"
  );

  return (
    <div key={message.id} className="space-y-1">
      {/* Chat Bubble */}
      <div
        className={cn(
          "flex items-end gap-3",
          message.role === "user" ? "justify-end" : "justify-start"
        )}
      >
        {message.role === "assistant" && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.avatar} />
            <AvatarFallback><Bot /></AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col items-end max-w-md lg:max-w-lg">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 shadow-md",
              message.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-none"
                : "bg-card text-card-foreground rounded-bl-none"
            )}
          >
            <p className="text-base">{message.content}</p>
          </div>
          
          {/* Rating display for user messages when recommendations are shown */}
          {message.role === "user" && showRecommendations && recommendation && (
            <div className="mt-1 mr-2">
              <RatingDisplay recommendation={recommendation} />
            </div>
          )}
        </div>
        {message.role === "user" && (
          <Avatar className="h-8 w-8">
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
})
            )}
            {isLoading && (
              <div className="flex items-end gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}`} />
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-md bg-card text-card-foreground rounded-bl-none">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-card/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>
                Analyzing your chat for suggestions...
              </div>
            )}
           
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="flex flex-col sm:flex-row gap-2">
               <Button type="button" variant="outline" size="icon" onClick={handleAnalyzeChat} disabled={isAnalyzing || messages.length < 2}>
  <Wand2 className="h-5 w-5"/>
  <span className="sr-only">{showRecommendations ? 'Hide Analysis' : 'Analyze Chat'}</span>
</Button>
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="h-5 w-5"/>
                  <span className="sr-only">Send Message</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Clear Chat Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearChat}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Persona Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{persona.name}" and all associated chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePersona}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Persona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Persona Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Persona</DialogTitle>
            <DialogDescription>
              Update your persona's traits, interests, writing style, and previous chat history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Persona name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your persona"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-traits">Traits</Label>
              <Textarea
                id="edit-traits"
                value={editForm.traits}
                onChange={(e) => setEditForm(prev => ({ ...prev, traits: e.target.value }))}
                placeholder="Personality traits (e.g., friendly, analytical, creative)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-interests">Interests</Label>
              <Textarea
                id="edit-interests"
                value={editForm.interests}
                onChange={(e) => setEditForm(prev => ({ ...prev, interests: e.target.value }))}
                placeholder="Topics and activities they're interested in"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-writing-style">Writing Style</Label>
              <Textarea
                id="edit-writing-style"
                value={editForm.writingStyle}
                onChange={(e) => setEditForm(prev => ({ ...prev, writingStyle: e.target.value }))}
                placeholder="How they communicate (e.g., casual, formal, humorous)"
                rows={3}
              />
            </div>
            
            {/* Previous Chat History Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-previous-chat">Previous Chat History</Label>
              <Textarea
                id="edit-previous-chat"
                value={editForm.previousChat}
                onChange={(e) => setEditForm(prev => ({ ...prev, previousChat: e.target.value }))}
                placeholder="Paste previous chat history from another platform (optional)..."
                rows={6}
                className="text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This helps the persona understand your conversation history from other platforms. 
                You can paste chat logs, conversation transcripts, or any relevant context here.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePersona}
              disabled={isUpdating || !editForm.name.trim()}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}