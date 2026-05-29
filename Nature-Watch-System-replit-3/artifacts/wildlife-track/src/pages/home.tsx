import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Wildlife Track" className="w-8 h-8" />
          <span className="text-xl font-bold text-foreground">Wildlife Track</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary">
            Sign In
          </Link>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
          For Park Rangers & Visitors
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
          Track Wildlife. <br className="hidden sm:block" />
          Protect Nature.
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          A serious field tool for recording animal sightings, receiving real-time alerts, and managing park emergencies with precision.
        </p>
        <div className="flex items-center gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">Join the Network</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>Wildlife Track &copy; {new Date().getFullYear()}. All rights reserved.</p>
      </footer>
    </div>
  );
}
