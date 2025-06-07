import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome to AI Coach</h1>
        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            Hello, {user.email}! Welcome to your AI Coach dashboard.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Workout Plans</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage your personalized workout routines.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your fitness journey and achievements.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized fitness advice from your AI coach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
