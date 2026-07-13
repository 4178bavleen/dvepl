import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { title: 'Total Users', value: '2,847', change: '+12.5%', icon: Users, trend: 'up' },
  { title: 'Active Subscriptions', value: '1,234', change: '+8.2%', icon: CreditCard, trend: 'up' },
  { title: 'Messages Today', value: '45,678', change: '+23.1%', icon: MessageSquare, trend: 'up' },
  { title: 'Monthly Revenue', value: '$89,432', change: '+15.3%', icon: TrendingUp, trend: 'up' },
];

const recentActivity = [
  { id: 1, action: 'New user registered', user: 'john@example.com', time: '2 mins ago', type: 'user' },
  { id: 2, action: 'Subscription upgraded', user: 'sarah@company.com', time: '15 mins ago', type: 'payment' },
  { id: 3, action: 'Message delivery failed', user: 'mike@startup.io', time: '32 mins ago', type: 'alert' },
  { id: 4, action: 'New subscription', user: 'emily@tech.co', time: '1 hour ago', type: 'payment' },
  { id: 5, action: 'User suspended', user: 'spam@bot.net', time: '2 hours ago', type: 'alert' },
];

const systemHealth = [
  { service: 'API Gateway', status: 'healthy', uptime: '99.99%' },
  { service: 'Message Queue', status: 'healthy', uptime: '99.95%' },
  { service: 'Database', status: 'healthy', uptime: '99.99%' },
  { service: 'WhatsApp Integration', status: 'degraded', uptime: '98.50%' },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and system health</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'alert' 
                        ? 'bg-red-100 dark:bg-red-900/20' 
                        : activity.type === 'payment'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      {activity.type === 'alert' ? (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : activity.type === 'payment' ? (
                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Service status and uptime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((service) => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {service.status === 'healthy' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="font-medium">{service.service}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{service.uptime}</span>
                      <Badge className={
                        service.status === 'healthy' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/users">
                  <Users className="h-5 w-5" />
                  <span>Manage Users</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/plans">
                  <CreditCard className="h-5 w-5" />
                  <span>Edit Plans</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/logs">
                  <MessageSquare className="h-5 w-5" />
                  <span>View Logs</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/settings">
                  <Activity className="h-5 w-5" />
                  <span>System Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
