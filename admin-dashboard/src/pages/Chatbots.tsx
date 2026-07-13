import { Plus, Bot, MessageSquare, Zap, MoreVertical, Play, Pause, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { cn } from "@/lib/utils";

const chatbots = [
  { 
    id: 1, 
    name: "Welcome Bot", 
    description: "Greets new customers and collects initial information",
    status: "active",
    conversations: 1250,
    responseRate: 98.5,
    triggers: ["First message", "Keyword: hello"],
  },
  { 
    id: 2, 
    name: "Order Status Bot", 
    description: "Provides real-time order tracking and updates",
    status: "active",
    conversations: 890,
    responseRate: 99.2,
    triggers: ["Keyword: order", "Keyword: track"],
  },
  { 
    id: 3, 
    name: "FAQ Bot", 
    description: "Answers frequently asked questions automatically",
    status: "active",
    conversations: 2340,
    responseRate: 94.8,
    triggers: ["Keyword: help", "Keyword: question"],
  },
  { 
    id: 4, 
    name: "Feedback Collector", 
    description: "Collects customer feedback after purchase",
    status: "paused",
    conversations: 450,
    responseRate: 87.3,
    triggers: ["After purchase", "24h delay"],
  },
  { 
    id: 5, 
    name: "Appointment Scheduler", 
    description: "Books appointments and sends reminders",
    status: "draft",
    conversations: 0,
    responseRate: 0,
    triggers: ["Keyword: book", "Keyword: appointment"],
  },
];

export default function Chatbots() {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Chatbots</h1>
                <p className="text-muted-foreground">Automate your customer conversations with AI</p>
              </div>
              <Button className="gradient-whatsapp text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
                Create Chatbot
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Bots</span>
                </div>
                <p className="text-2xl font-bold text-foreground">5</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Play className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Active Bots</span>
                </div>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-info/10">
                    <MessageSquare className="h-5 w-5 text-info" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Conversations</span>
                </div>
                <p className="text-2xl font-bold text-foreground">4,930</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-warning/10">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Avg Response Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">94.9%</p>
              </div>
            </div>

            {/* Chatbot List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chatbots.map((bot) => (
                <div key={bot.id} className="card-elevated p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        bot.status === "active" ? "bg-primary/10" : 
                        bot.status === "paused" ? "bg-warning/10" : "bg-muted"
                      )}>
                        <Bot className={cn(
                          "h-6 w-6",
                          bot.status === "active" ? "text-primary" : 
                          bot.status === "paused" ? "text-warning" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{bot.name}</h3>
                          <Badge variant="outline" className={cn(
                            "capitalize text-xs",
                            bot.status === "active" ? "bg-success/10 text-success border-success/20" :
                            bot.status === "paused" ? "bg-warning/10 text-warning border-warning/20" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {bot.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{bot.description}</p>
                      </div>
                    </div>
                    <Switch checked={bot.status === "active"} />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {bot.triggers.map((trigger, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {trigger}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Conversations: </span>
                        <span className="font-medium text-foreground">{bot.conversations.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Rate: </span>
                        <span className="font-medium text-success">{bot.responseRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
