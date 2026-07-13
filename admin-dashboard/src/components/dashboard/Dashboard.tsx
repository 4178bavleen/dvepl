import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Users, 
  UserPlus, 
  Megaphone,
  Bot,
  TrendingUp
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { ConversationItem } from "./ConversationItem";
import { QuickActionCard } from "./QuickActionCard";
import { BroadcastItem } from "./BroadcastItem";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const conversations = [
  {
    name: "Sarah Johnson",
    message: "Thanks for the quick response! I'll proceed with the order.",
    time: "2m ago",
    unread: 2,
    status: "read" as const,
  },
  {
    name: "Michael Chen",
    message: "Can you share the product catalog?",
    time: "15m ago",
    status: "delivered" as const,
  },
  {
    name: "Emma Wilson",
    message: "Hi! I'd like to know more about your services",
    time: "1h ago",
    unread: 1,
  },
  {
    name: "David Brown",
    message: "Perfect, I'll wait for the delivery update",
    time: "2h ago",
    status: "read" as const,
  },
  {
    name: "Lisa Anderson",
    message: "Is this available in blue color?",
    time: "3h ago",
    status: "sent" as const,
  },
];

const broadcasts = [
  {
    name: "Holiday Sale Announcement",
    status: "active" as const,
    sent: 4520,
    total: 5000,
    date: "Jan 7, 2025",
  },
  {
    name: "New Product Launch",
    status: "scheduled" as const,
    sent: 0,
    total: 8500,
    date: "Jan 10, 2025",
  },
  {
    name: "Weekly Newsletter",
    status: "completed" as const,
    sent: 3200,
    total: 3200,
    date: "Jan 5, 2025",
  },
];

export function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Metrics Grid */}
            <section className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Messages"
                  value="24,589"
                  change="+12.5%"
                  changeType="positive"
                  icon={MessageSquare}
                  variant="primary"
                />
                <MetricCard
                  title="Messages Sent"
                  value="18,432"
                  change="+8.2%"
                  changeType="positive"
                  icon={Send}
                />
                <MetricCard
                  title="Read Rate"
                  value="94.2%"
                  change="+2.1%"
                  changeType="positive"
                  icon={CheckCheck}
                  variant="success"
                />
                <MetricCard
                  title="Active Contacts"
                  value="8,124"
                  change="+156"
                  changeType="positive"
                  icon={Users}
                />
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Conversations */}
              <section className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="card-elevated">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Recent Conversations</h2>
                      <p className="text-sm text-muted-foreground">Your latest customer interactions</p>
                    </div>
                    <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="p-2 space-y-1">
                    {conversations.map((conv, index) => (
                      <ConversationItem
                        key={index}
                        {...conv}
                        isActive={index === 0}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <QuickActionCard
                    icon={Megaphone}
                    title="Create Broadcast"
                    description="Send messages to multiple contacts at once"
                    variant="primary"
                  />
                  <QuickActionCard
                    icon={UserPlus}
                    title="Import Contacts"
                    description="Add new contacts from CSV or Excel file"
                  />
                  <QuickActionCard
                    icon={Bot}
                    title="Setup Chatbot"
                    description="Automate responses with AI-powered bots"
                  />
                  <QuickActionCard
                    icon={TrendingUp}
                    title="View Analytics"
                    description="Track your messaging performance"
                  />
                </div>
              </section>
            </div>

            {/* Broadcasts Section */}
            <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Recent Broadcasts</h2>
                  <p className="text-sm text-muted-foreground">Track your campaign performance</p>
                </div>
                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  View All Campaigns
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {broadcasts.map((broadcast, index) => (
                  <BroadcastItem key={index} {...broadcast} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
