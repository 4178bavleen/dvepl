import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  Handshake, 
  TrendingUp, 
  ArrowRight,
  Briefcase,
  DollarSign,
  Plus,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

import { hrmsApi, crmApi, tenderApi } from '@/services/modules';
import { organizationApi } from '@/services/organization';
import { useERPStore } from '@/store/erpStore';

export function DashboardOverview() {
  const navigate = useNavigate();
  const currentCompanyId = useERPStore((state) => state.currentCompanyId);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void Promise.all([
      hrmsApi.employees.list(),
      hrmsApi.attendance.list(),
      crmApi.customers.list(),
      tenderApi.tenders.list(),
      organizationApi.costCenters.list(),
    ]).then(([employeeData, attendanceData, customerData, tenderData, costCenterData]) => {
      if (!isMounted) return;
      setEmployees(employeeData);
      setAttendances(attendanceData);
      setCustomers(customerData);
      setTenders(tenderData);
      setCostCenters(costCenterData);
    }).catch(() => toast.error('Unable to load live dashboard data.'))
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [currentCompanyId]);
  // ── data derived directly from typed constants ──
  const rawEmployees = employees.filter((employee) => !employee.deletedAt && (!employee.companyId || employee.companyId === currentCompanyId));
  const activeEmployees = rawEmployees.filter(e => e.status === 'ACTIVE').length;
  const rawTenders = tenders.filter((tender) => !tender.deletedAt && (!tender.companyId || tender.companyId === currentCompanyId));
  const activeTenders = rawTenders.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const rawCustomers = customers.filter((customer) => !customer.deletedAt && (!customer.companyId || customer.companyId === currentCompanyId));
  const rawCostCenters = costCenters.filter((cc) => !cc.companyId || cc.companyId === currentCompanyId);
  // Calculate total cost budget dynamically
  const totalBudget = rawCostCenters.reduce((sum, cc) => sum + Number(cc.budget || 0), 0);

  // Chart data – from constants
  const departmentBudgetData = rawCostCenters.map(cc => ({
    name: cc.name.replace(' Cost Center', '').replace(' Overhead', '').slice(0, 15),
    Budget: Number(cc.budget || 0) / 100000 // In Lakhs
  }));

  const tenderPieData = [
    { name: 'Open', value: rawTenders.filter(t => t.status === 'OPEN').length, color: '#3B82F6' },
    { name: 'In Progress', value: rawTenders.filter(t => t.status === 'IN_PROGRESS').length, color: '#F59E0B' },
    { name: 'Completed', value: rawTenders.filter(t => t.status === 'COMPLETED').length, color: '#10B981' },
    { name: 'Draft', value: rawTenders.filter(t => t.status === 'DRAFT').length, color: '#6B7280' },
  ].filter(item => item.value > 0);

  const revenueData = useMemo(() => {
    const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totals = new Map<string, number>();
    rawTenders.forEach((tender) => {
      // prefer dueDate, fall back to createdAt so every tender is counted
      const dateStr = tender.dueDate || tender.createdAt;
      if (!dateStr) return;
      const month = new Date(dateStr).toLocaleString('default', { month: 'short' });
      totals.set(month, (totals.get(month) ?? 0) + Number(tender.estimatedCost ?? 0));
    });
    // Sort by calendar month order, only include months that have data
    return MONTH_ORDER
      .filter((m) => totals.has(m))
      .map((month) => ({ month, Revenue: totals.get(month)! }));
  }, [rawTenders]);

  const customerGrowthData = useMemo(() => {
    const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const counts = new Map<string, number>();
    rawCustomers.forEach((customer) => {
      const dateStr = customer.createdAt;
      if (!dateStr) return;
      const month = new Date(dateStr).toLocaleString('default', { month: 'short' });
      counts.set(month, (counts.get(month) ?? 0) + 1);
    });
    // Build sorted months, compute cumulative total
    let cumulative = 0;
    return MONTH_ORDER
      .filter((m) => counts.has(m))
      .map((month) => {
        cumulative += counts.get(month)!;
        return { month, New: counts.get(month)!, Total: cumulative };
      });
  }, [rawCustomers]);


  const attendanceTrendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const dailyRecords = attendances.filter((attendance) => String(attendance.date).slice(0, 10) === key);
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        Present: dailyRecords.filter((attendance) => attendance.status === 'PRESENT').length,
        Absent: dailyRecords.filter((attendance) => attendance.status === 'ABSENT').length,
      };
    });
  }, [attendances]);

  const handleQuickCreate = (type: string) => {
    if (type === 'Tender') navigate('/tender/tenders');
    else if (type === 'Employee') navigate('/hrms/employees');
    else if (type === 'Customer') navigate('/crm/customers');
    else if (type === 'Log') navigate('/crm/communication');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Breadcrumb */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground/80">ERP Enterprise Dashboard</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Control Center</h1>
      </div>

      {/* 1. TOP KPI PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="h-4 w-4" /></div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{rawEmployees.length}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+{activeEmployees} Active</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Headcount in active payroll</p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Tenders</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Briefcase className="h-4 w-4" /></div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{activeTenders}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning flex items-center gap-0.5">
              <span>{rawTenders.length} Total</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Bids in open pipeline</p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Handshake className="h-4 w-4" /></div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{rawCustomers.length}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+12% MoM</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Active corporate accounts</p>
        </div>

        {/* Card 4 */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Budgets</span>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight">
              ₹{totalBudget >= 100000 ? `${(totalBudget / 100000).toFixed(1)}L` : totalBudget.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-0.5">
              <span>{rawCostCenters.length} Cost Centers</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Aggregated operational budgets</p>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Growth (Area Chart) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Customer Growth</h2>
              <p className="text-[10px] text-muted-foreground">Cumulative & new customers added per month</p>
            </div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{rawCustomers.length} Total</span>
            </span>
          </div>
          <div className="h-[240px] relative">
            {customerGrowthData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Handshake className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">
                  {isLoading ? 'Loading customer data…' : 'No customer data available yet.'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    formatter={(value, name) => [value ?? 0, name === 'Total' ? 'Cumulative Customers' : 'New Customers']}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="Total" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="New" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tender pipeline status (Pie/Donut Chart) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">Tender Allocation</h2>
            <p className="text-[10px] text-muted-foreground">Status split of bidding processes</p>
          </div>
          <div className="h-[200px] mt-2 relative">
            {tenderPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tenderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tenderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
                No active tenders.
              </div>
            )}
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 text-xs mt-3 border-t border-border pt-3">
            {tenderPieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 font-medium text-foreground/80">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. ADDITIONAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Trends */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold tracking-tight text-foreground mb-4">Weekly Attendance Trend</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="Present" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Absent" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Center Budgets (Bar Chart) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold tracking-tight text-foreground mb-4">Cost Center Budgets (Lakhs INR)</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBudgetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {departmentBudgetData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#8B5CF6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* 4. LOWER LEVEL WIDGETS */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">Operational Shortcuts</h2>
            <p className="text-[10px] text-muted-foreground">Quick access actions to core system operations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleQuickCreate('Tender')} className="h-12 text-xs font-semibold justify-start gap-2.5 border-border hover:bg-muted/40 px-4">
              <Plus className="h-4 w-4 text-primary" />
              <span>Add Tender</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickCreate('Employee')} className="h-12 text-xs font-semibold justify-start gap-2.5 border-border hover:bg-muted/40 px-4">
              <Plus className="h-4 w-4 text-success" />
              <span>Add Employee</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickCreate('Customer')} className="h-12 text-xs font-semibold justify-start gap-2.5 border-border hover:bg-muted/40 px-4">
              <Plus className="h-4 w-4 text-warning" />
              <span>Add Customer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickCreate('Log')} className="h-12 text-xs font-semibold justify-start gap-2.5 border-border hover:bg-muted/40 px-4">
              <Plus className="h-4 w-4 text-indigo-500" />
              <span>Log Call</span>
            </Button>
          </div>
        </div>

      </div>

      </div>

    </div>
  );
}

export default DashboardOverview;
