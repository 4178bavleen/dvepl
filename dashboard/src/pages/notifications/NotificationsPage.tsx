import React from 'react';
import { 
  Bell, 
  Settings, 
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export function NotificationsPage() {
  const mockSystemAlerts = [
    { id: 'notif-1', title: 'Security Incident: Root Login from unknown IP', level: 'HIGH', date: '2026-07-16 10:12:05', desc: 'An operator successfully logged in from 192.168.1.1. Check access ledger.' },
    { id: 'notif-2', title: 'Tender Application sequence generated', level: 'INFO', date: '2026-07-15 18:45:00', desc: 'Reference code REF-2026-0034 generated for bid Central Railway.' },
    { id: 'notif-3', title: 'Backup execution completed successfully', level: 'SUCCESS', date: '2026-07-15 00:00:10', desc: 'Weekly snapshot of erpStore Zustand context exported and verified.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-muted-foreground/80">System Alerts & Notifications</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Control Center Logs</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
          <Bell className="h-4.5 w-4.5 text-primary" />
          <span>Active System Notifications</span>
        </h2>
        <p className="text-xs text-muted-foreground">This panel aggregates security triggers, system backup summaries, and PRBAC audits.</p>
        
        <div className="divide-y divide-border/60">
          {mockSystemAlerts.map(alert => (
            <div key={alert.id} className="py-4 flex gap-3 text-xs items-start">
              {alert.level === 'HIGH' ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> : 
               alert.level === 'INFO' ? <Info className="h-4 w-4 text-info shrink-0 mt-0.5" /> :
               <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-foreground">{alert.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{alert.date}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Cleared all alerts.')} className="h-8 text-xs">
            Clear All Alerts
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
