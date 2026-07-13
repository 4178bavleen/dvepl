import { TrendingUp, TrendingDown, MessageSquare, Users, CheckCheck, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const messageData = [
  { name: "Mon", sent: 4000, received: 2400 },
  { name: "Tue", sent: 3000, received: 1398 },
  { name: "Wed", sent: 2000, received: 9800 },
  { name: "Thu", sent: 2780, received: 3908 },
  { name: "Fri", sent: 1890, received: 4800 },
  { name: "Sat", sent: 2390, received: 3800 },
  { name: "Sun", sent: 3490, received: 4300 },
];

const responseTimeData = [
  { name: "00:00", time: 2.5 },
  { name: "04:00", time: 3.2 },
  { name: "08:00", time: 1.8 },
  { name: "12:00", time: 2.1 },
  { name: "16:00", time: 1.5 },
  { name: "20:00", time: 2.8 },
];

const metrics = [
  { 
    title: "Total Messages", 
    value: "24,589", 
    change: "+12.5%", 
    positive: true,
    icon: MessageSquare,
    color: "primary"
  },
  { 
    title: "Active Contacts", 
    value: "8,124", 
    change: "+8.2%", 
    positive: true,
    icon: Users,
    color: "info"
  },
  { 
    title: "Read Rate", 
    value: "94.2%", 
    change: "+2.1%", 
    positive: true,
    icon: CheckCheck,
    color: "success"
  },
  { 
    title: "Avg Response Time", 
    value: "2.4m", 
    change: "-0.5m", 
    positive: true,
    icon: Clock,
    color: "warning"
  },
];

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export default function Analytics() {
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
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Track your messaging performance and insights</p>
              </div>
              <Select defaultValue="7d">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <div key={metric.title} className="card-elevated p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{metric.title}</span>
                    <div className={`p-2 rounded-xl ${colorMap[metric.color]}`}>
                      <metric.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                    <div className={`flex items-center gap-1 text-sm font-medium ${metric.positive ? "text-success" : "text-destructive"}`}>
                      {metric.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {metric.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Volume Chart */}
              <div className="card-elevated p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground">Message Volume</h3>
                    <p className="text-sm text-muted-foreground">Sent vs Received messages</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Sent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-info" />
                      <span className="text-muted-foreground">Received</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={messageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sent" 
                        stackId="1" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="received" 
                        stackId="2" 
                        stroke="hsl(var(--info))" 
                        fill="hsl(var(--info) / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response Time Chart */}
              <div className="card-elevated p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground">Response Time</h3>
                    <p className="text-sm text-muted-foreground">Average response time by hour</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="m" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                        formatter={(value: number) => [`${value} min`, "Response Time"]}
                      />
                      <Bar dataKey="time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Table */}
            <div className="card-elevated p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Campaign Performance</h3>
                  <p className="text-sm text-muted-foreground">Detailed breakdown of recent campaigns</p>
                </div>
                <Button variant="outline" size="sm">Export Report</Button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">Sent</th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">Delivered</th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">Read</th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">Replied</th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 font-medium text-foreground">Holiday Sale</td>
                    <td className="py-3 text-muted-foreground">5,000</td>
                    <td className="py-3 text-muted-foreground">4,920</td>
                    <td className="py-3 text-muted-foreground">4,150</td>
                    <td className="py-3 text-muted-foreground">890</td>
                    <td className="py-3 text-success font-medium">18.2%</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 font-medium text-foreground">Weekly Newsletter</td>
                    <td className="py-3 text-muted-foreground">3,200</td>
                    <td className="py-3 text-muted-foreground">3,180</td>
                    <td className="py-3 text-muted-foreground">2,850</td>
                    <td className="py-3 text-muted-foreground">420</td>
                    <td className="py-3 text-success font-medium">14.7%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-foreground">Flash Sale Alert</td>
                    <td className="py-3 text-muted-foreground">6,500</td>
                    <td className="py-3 text-muted-foreground">6,420</td>
                    <td className="py-3 text-muted-foreground">5,800</td>
                    <td className="py-3 text-muted-foreground">1,250</td>
                    <td className="py-3 text-success font-medium">21.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
