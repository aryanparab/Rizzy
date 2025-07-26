"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogOut ,User,Music} from "lucide-react"
import { useRouter } from "next/navigation"
import { Bot } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Persona } from "@/lib/types"

const personaFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  traits: z.string().min(10, {
    message: "Please describe the persona's traits in at least 10 characters.",
  }),
  interests: z.string().min(10, {
    message: "Please describe the persona's interests in at least 10 characters.",
  }),
  writingStyle: z.string().min(10, {
    message: "Please describe the persona's writing style in at least 10 characters.",
  }),
  previousChat: z.string().min(0, {
    message: "Please describe the persona's writing style in at least 10 characters.",
  }),
})

export default function NewPersona() {
    const { data: session, status } = useSession()

  const router = useRouter()

  const form = useForm<z.infer<typeof personaFormSchema>>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      name: "",
      description:"",
      traits: "",
      interests: "",
      writingStyle: "",
    },
  })

 async function onSubmit(values: z.infer<typeof personaFormSchema>) {
  if (!session?.user?.email) return;

  const response = await fetch("/api/persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: session.user.email,
      ...values
      
    }),
  });

  if (response.ok) {
    const { persona_id } = await response.json();
    const persona = {
      id: persona_id,
       ...values
    };

    // ✅ Save persona to localStorage before navigating
    localStorage.setItem("alter-ego-persona", JSON.stringify(persona));
    localStorage.removeItem("alter-ego-messages");
    router.push(`/chat/${persona_id}`);
  } else {
    console.error("Failed to create persona");
  }
}


  
  if (!session) {
    return (
      <div className="auth-wrapper">
        <div className="auth-box">
          <h1 className="auth-heading">
            <Music size={36} />
            <span>Your Wingman</span>
          </h1>
          <p className="auth-description">
            Before Alter Ego, log in with yourself
          </p>
          <button onClick={() => signIn('google')} className="auth-button">
            <User size={18} />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
       {/* <div className="user-header">
        <div className="user-profile">
          <div className="avatar">
            {session.user?.image ? (
              <img src={session.user.image} alt="User Avatar" className="avatar-img" />
            ) : (
              <span className="avatar-fallback">
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="welcome-msg">
            Welcome, {session.user?.name?.split(' ')[0]}
          </span>
        </div>
        <button onClick={() => signOut()} className="logout-button">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div> */}


      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Alter Ego Chat</CardTitle>
          <CardDescription>Create a persona to start a conversation with your AI wingman.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex, a witty artist" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your alter ego a name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex, a witty artist" {...field} />
                    </FormControl>
                    <FormDescription>
                      Who is this Person to you
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="traits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personality Traits</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Confident, curious, loves dad jokes, a bit sarcastic..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Describe how your alter ego behaves and thinks.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests & Hobbies</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Hiking, vintage sci-fi movies, learning new languages, trying exotic foods..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What does your alter ego like to do and talk about?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="writingStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Writing Style</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Uses emojis sparingly, writes in short sentences, sometimes uses slang, very expressive..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      How does your alter ego text?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousChat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste if you have any chat history with the person on whatsapp, instagram etc"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      How does your alter ego text?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">
                <Bot className="mr-2 h-5 w-5" />
                Start Chatting
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
