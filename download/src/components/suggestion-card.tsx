"use client"

import { Lightbulb, Copy, X } from "lucide-react"
import type { Suggestion } from "@/lib/types"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useToast } from "@/hooks/use-toast"

interface SuggestionCardProps {
  suggestion: Suggestion;
  onClose: () => void;
  onApply: (text: string) => void;
}

export function SuggestionCard({ suggestion, onClose, onApply }: SuggestionCardProps) {
  const { toast } = useToast()

  const handleApply = () => {
    onApply(suggestion.suggestedText)
    toast({
        title: "Suggestion Applied!",
        description: "The text has been copied to your input.",
    })
  }
  
  return (
    <Card className="relative animate-in fade-in-50 slide-in-from-bottom-5 duration-300 bg-accent/20 dark:bg-accent/10 border-accent/50">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4"/>
            <span className="sr-only">Close suggestion</span>
        </Button>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline">
                <Lightbulb className="text-amber-400"/>
                AI Suggestion
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p className="font-semibold mb-2">You could try saying this:</p>
                <blockquote className="border-l-4 border-primary pl-4 py-2 bg-background rounded-r-md">
                    <p className="italic">"{suggestion.suggestedText}"</p>
                </blockquote>
            </div>
            <div>
                <p className="font-semibold mb-2">Here's why:</p>
                <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
            </div>
            <div className="flex justify-end">
                 <Button onClick={handleApply}>
                    <Copy className="mr-2 h-4 w-4"/>
                    Apply Suggestion
                 </Button>
            </div>
        </CardContent>
    </Card>
  )
}
