import { Plus, Calendar, Users, BarChart3, Play, Pause, MoreVertical, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { cn } from "@/lib/utils";

const broadcasts = [
  { id: 1, name: "Holiday Sale Announcement", status: "active", sent: 4520, total: 5000, delivered: 4480, read: 3890, date: "Jan 7, 2025", time: "10:00 AM" },
  { id: 2, name: "New Product Launch", status: "scheduled", sent: 0, total: 8500, delivered: 0, read: 0, date: "Jan 10, 2025", time: "2:00 PM" },
  { id: 3, name: "Weekly Newsletter", status: "completed", sent: 3200, total: 3200, delivered: 3180, read: 2850, date: "Jan 5, 2025", time: "9:00 AM" },
  { id: 4, name: "Flash Sale Alert", status: "completed", sent: 6500, total: 6500, delivered: 6420, read: 5800, date: "Jan 3, 2025", time: "11:00 AM" },
  { id: 5, name: "Customer Feedback Request", status: "draft", sent: 0, total: 2000, delivered: 0, read: 0, date: "-", time: "-" },
  { id: 6, name: "VIP Exclusive Offer", status: "paused", sent: 1200, total: 3000, delivered: 1180, read: 980, date: "Jan 6, 2025", time: "3:00 PM" },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-primary/10", text: "text-primary" },
  scheduled: { bg: "bg-info/10", text: "text-info" },
  completed: { bg: "bg-success/10", text: "text-success" },
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  paused: { bg: "bg-warning/10", text: "text-warning" },
};

export default function Broadcasts() {
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
                <h1 className="text-2xl font-bold text-foreground">Broadcasts</h1>
                <p className="text-muted-foreground">Create and manage your broadcast campaigns</p>
              </div>
              <Button className="gradient-whatsapp text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
                Create Broadcast
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Sent</span>
                </div>
                <p className="text-2xl font-bold text-foreground">15,420</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Delivered</span>
                </div>
                <p className="text-2xl font-bold text-foreground">15,260</p>
                <p className="text-sm text-success">98.9% rate</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-info/10">
                    <Calendar className="h-5 w-5 text-info" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-warning/10">
                    <Play className="h-5 w-5 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Active Now</span>
                </div>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10 w-64 bg-muted/50" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <div key={broadcast.id} className="card-elevated p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl", statusStyles[broadcast.status].bg)}>
                          {broadcast.status === "active" ? (
                            <Play className={cn("h-5 w-5", statusStyles[broadcast.status].text)} />
                          ) : broadcast.status === "paused" ? (
                            <Pause className={cn("h-5 w-5", statusStyles[broadcast.status].text)} />
                          ) : (
                            <Calendar className={cn("h-5 w-5", statusStyles[broadcast.status].text)} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{broadcast.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {broadcast.total.toLocaleString()} recipients
                            </span>
                            {broadcast.date !== "-" && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {broadcast.date} at {broadcast.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(statusStyles[broadcast.status].bg, statusStyles[broadcast.status].text, "border-transparent capitalize")}>
                          {broadcast.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {broadcast.status !== "draft" && broadcast.status !== "scheduled" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">
                            {broadcast.sent.toLocaleString()} / {broadcast.total.toLocaleString()} sent
                          </span>
                        </div>
                        <Progress value={(broadcast.sent / broadcast.total) * 100} className="h-2" />
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Delivered: </span>
                            <span className="font-medium text-foreground">{broadcast.delivered.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Read: </span>
                            <span className="font-medium text-foreground">{broadcast.read.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Read Rate: </span>
                            <span className="font-medium text-success">
                              {broadcast.sent > 0 ? ((broadcast.read / broadcast.sent) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
