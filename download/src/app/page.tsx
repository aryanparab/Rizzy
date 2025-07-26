"use client"
import { LogOut, User, MessageCircle, Plus, Bot, Heart, Sparkles, Settings, ChevronDown, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState, useCallback, useRef } from "react"
import { fetchPersonaList, fetchUserProfile, updateUserProfile } from "../lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [personas, setPersonas] = useState([])
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    goals: '',
    interests: '',
    communicationStyle: ''
  })
  const router = useRouter()
  
  // Use refs to track if we've already made the initial calls
  const hasInitialized = useRef(false)
  const abortControllerRef = useRef(null)

  const handleNewPersona = () => {
    router.push('/newPersona')
  }

  const handlePersonaClick = (persona) => {
    localStorage.setItem("alter-ego-persona", JSON.stringify(persona))
    localStorage.removeItem("alter-ego-messages")
    router.push(`/chat/${persona.persona_id}`)
  }

  const handleUpdateProfile = useCallback(async () => {
    if (!session?.user?.email || isUpdatingProfile) return;
    
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(session.user.email, profileForm);
      setShowProfileDialog(false);
      setIsNewUser(false);
      // You could add a toast here for success
    } catch (error) {
      console.error("Failed to update profile:", error);
      // You could add a toast here for error
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [session?.user?.email, profileForm, isUpdatingProfile]);

  const openProfileDialog = useCallback(() => {
    setShowProfileDialog(true);
  }, []);

  // Memoize the initialization function
  const initializeData = useCallback(async (userEmail) => {
    if (!userEmail || hasInitialized.current || isInitializing) return;
    
    setIsInitializing(true);
    hasInitialized.current = true;

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Fetch personas and profile in parallel, but handle errors independently
      const [personaResult, profileResult] = await Promise.allSettled([
        fetchPersonaList(userEmail),
        fetchUserProfile(userEmail)
      ]);

      // Handle personas
      if (personaResult.status === 'fulfilled') {
        setPersonas(personaResult.value || []);
      } else {
        console.error("Failed to fetch personas:", personaResult.reason);
        setPersonas([]);
      }

      // Handle profile
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value;
        setProfileForm(prev => ({
          ...prev,
          name: profile.name || session.user?.name || '',
          bio: profile.bio || '',
          goals: profile.goals || '',
          interests: profile.interests || '',
          communicationStyle: profile.communicationStyle || ''
        }));
        setIsNewUser(false);
      } else {
        // Profile doesn't exist or failed to fetch
        console.log("No profile found or database unavailable, treating as new user");
        setIsNewUser(true);
        setProfileForm(prev => ({
          ...prev,
          name: session.user?.name || '',
          bio: '',
          goals: '',
          interests: '',
          communicationStyle: ''
        }));
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Initialization failed:", error);
        // Set up basic user state on error
        setIsNewUser(true);
        setProfileForm(prev => ({
          ...prev,
          name: session.user?.name || ''
        }));
      }
    } finally {
      setIsInitializing(false);
    }
  }, [session?.user?.name]);

  // Single useEffect for initialization
  useEffect(() => {
    if (status === 'loading' || !session?.user?.email) {
      return;
    }

    initializeData(session.user.email);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [session?.user?.email, status, initializeData]);

  // Reset initialization flag when user changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [session?.user?.email]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-muted/10 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-muted/30 to-secondary/5 dark:from-primary/10 dark:via-muted/10 dark:to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                YourWingman
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Your AI companion that helps you connect, communicate, and grow through personalized conversations and insights.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => signIn('google')} 
              className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <User className="mr-3 h-5 w-5" />
              Sign in with Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Create personas that mirror your ideal conversations
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-muted/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold">YourWingman</h1>
              <p className="text-xs text-muted-foreground">AI-powered conversation coach</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted/80">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image} alt={session.user?.name} />
                    <AvatarFallback className="text-xs">
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openProfileDialog}>
                  <Settings className="mr-2 h-4 w-4" />
                  {isNewUser ? 'Complete Profile' : 'Update Profile'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* New User Welcome Banner */}
      {isNewUser && !isInitializing && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Welcome to YourWingman!</p>
                  <p className="text-sm text-primary/80">Complete your profile to get personalized AI personas and better coaching insights.</p>
                </div>
              </div>
              <Button onClick={openProfileDialog} size="sm" variant="default">
                Complete Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Loading state for initialization */}
        {isInitializing ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Setting up your dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Welcome back, {session.user?.name?.split(' ')[0]}! 
                <Sparkles className="inline h-8 w-8 ml-2 text-primary" />
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Practice conversations with AI personas that adapt to your communication style. 
                Get personalized insights to improve your social interactions.
              </p>
              <br />
              {!isNewUser && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Keep your profile updated for more personalized results!
                </p>
              )}
            </div>

            {/* Create New Persona Button */}
            <div className="flex justify-center mb-8">
              <Button 
                onClick={handleNewPersona} 
                size="lg" 
                className="h-14 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-3 h-5 w-5" />
                Create New Persona
              </Button>
            </div>

            <Separator className="mb-8" />

            {/* Personas Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-semibold">Your Personas</h3>
                {personas.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
                  </Badge>
                )}
              </div>

              {personas.length === 0 ? (
                <Card className="text-center py-12 bg-card/50">
                  <CardContent className="space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-semibold">No personas yet</h4>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create your first persona to start practicing conversations and receiving personalized coaching insights.
                    </p>
                    <Button onClick={handleNewPersona} variant="outline" size="lg" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Persona
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personas.map((persona, i) => {
                    if (!persona.name) return null

                    return (
                      <Card 
                        key={persona.persona_id || i} 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card/80 backdrop-blur-sm"
                        onClick={() => handlePersonaClick(persona)}
                      >
                        <CardHeader className="text-center pb-3">
                          <Avatar className="h-16 w-16 mx-auto border-4 border-primary/20 shadow-md">
                            <AvatarImage 
                              src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(persona.name)}&radius=30`} 
                              alt={persona.name} 
                            />
                            <AvatarFallback className="text-lg font-bold">
                              {persona.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-lg">{persona.name}</CardTitle>
                          {persona.description && (
                            <CardDescription className="text-sm line-clamp-2">
                              {persona.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button variant="outline" className="w-full">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Start Chat
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Info Section */}
            {personas.length > 0 && (
              <div className="mt-12 text-center">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-6">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Pro tip:</strong> The more you chat with your personas, the better insights you'll receive about your communication patterns and areas for improvement.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Profile Update Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}
            </DialogTitle>
            <DialogDescription>
              {isNewUser 
                ? 'Welcome! Help YourWingman understand you better by sharing your goals, interests, and communication preferences to get personalized AI personas.'
                : 'Help YourWingman understand you better by sharing your goals, interests, and communication preferences.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Display Name *</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your preferred name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-goals">Your Goals</Label>
              <Textarea
                id="profile-goals"
                value={profileForm.goals}
                onChange={(e) => setProfileForm(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="What do you want to improve? (e.g., dating confidence, professional networking, social skills)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-interests">Interests & Hobbies</Label>
              <Textarea
                id="profile-interests"
                value={profileForm.interests}
                onChange={(e) => setProfileForm(prev => ({ ...prev, interests: e.target.value }))}
                placeholder="What are you passionate about? This helps create relevant conversation scenarios."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-communication">Communication Style</Label>
              <Textarea
                id="profile-communication"
                value={profileForm.communicationStyle}
                onChange={(e) => setProfileForm(prev => ({ ...prev, communicationStyle: e.target.value }))}
                placeholder="How do you prefer to communicate? (e.g., direct, thoughtful, humorous, formal)"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowProfileDialog(false)}
              disabled={isUpdatingProfile}
            >
              <X className="mr-2 h-4 w-4" />
              {isNewUser ? 'Skip for now' : 'Cancel'}
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile || !profileForm.name.trim()}
            >
              {isUpdatingProfile ? (
                <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isNewUser ? 'Complete Profile' : 'Save Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}