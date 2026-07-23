import React from 'react';
import { useERPStore } from '@/store/erpStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function AuditLogsPage() {
  const store = useERPStore();
  const [search, setSearch] = React.useState('');
  const [action, setAction] = React.useState('ALL');
  const [moduleSelect, setModuleSelect] = React.useState('ALL');

  // Filter logs
  const filteredLogs = React.useMemo(() => {
    return store.auditLogs.filter(log => {
      // Search filter
      const matchesSearch = 
        log.recordId.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.includes(search)) ||
        (log.userId && log.userId.toLowerCase().includes(search.toLowerCase()));

      // Action filter
      const matchesAction = action === 'ALL' || log.action === action;

      // Module filter
      const matchesModule = moduleSelect === 'ALL' || log.module === moduleSelect;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [store.auditLogs, search, action, moduleSelect]);

  // Extract unique modules
  const uniqueModules = React.useMemo(() => {
    return Array.from(new Set(store.auditLogs.map(log => log.module)));
  }, [store.auditLogs]);

  // Helper to render field changes diff
  const renderDiff = (log: any) => {
    const oldVal = log.oldValue;
    const newVal = log.newValue;

    if (log.action === 'CREATE') {
      if (!newVal) return null;
      return (
        <div className="space-y-1.5 mt-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Created Fields</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-success/5 p-3 rounded-xl border border-success/15 text-[11px]">
            {Object.entries(newVal)
              .filter(([k]) => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt')
              .map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground font-semibold font-mono">{k}:</span>
                  <span className="text-foreground font-medium truncate">{String(v ?? '—')}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (log.action === 'UPDATE') {
      if (!oldVal || !newVal) return null;
      const changes = [];
      for (const key in newVal) {
        if (key !== 'updatedAt' && JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
          changes.push({
            key,
            from: oldVal[key],
            to: newVal[key]
          });
        }
      }

      if (changes.length === 0) {
        return <span className="text-[10px] text-muted-foreground italic font-medium">Internal metadata modified.</span>;
      }

      return (
        <div className="space-y-1.5 mt-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Field Modifications</span>
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card/50 divide-y divide-border/60">
            {changes.map(ch => (
              <div key={ch.key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 text-[11px] items-center hover:bg-muted/10 transition-colors">
                <div className="font-semibold text-foreground/80 font-mono truncate">{ch.key}</div>
                <div className="text-destructive bg-destructive/10 px-2 py-0.5 rounded-md font-mono line-through text-[10px] truncate max-w-full w-fit">
                  {String(ch.from ?? 'null')}
                </div>
                <div className="text-success bg-success/10 px-2 py-0.5 rounded-md font-mono text-[10px] truncate max-w-full w-fit flex items-center gap-1">
                  <span>&rarr;</span>
                  <span className="font-bold">{String(ch.to ?? 'null')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (log.action === 'DELETE') {
      return (
        <div className="space-y-1.5 mt-2 bg-destructive/5 p-3 rounded-xl border border-destructive/15 text-[11px] text-destructive font-medium">
          Record was completely purged from system directory.
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground/80">Security Audit Trail</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Enterprise Ledger History</h1>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Logged Operations</p>
          <p className="text-xl font-bold tracking-tight mt-1 text-foreground">{store.auditLogs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Creates</p>
          <p className="text-xl font-bold tracking-tight mt-1 text-success">
            {store.auditLogs.filter(l => l.action === 'CREATE').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Updates</p>
          <p className="text-xl font-bold tracking-tight mt-1 text-primary">
            {store.auditLogs.filter(l => l.action === 'UPDATE').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deletions</p>
          <p className="text-xl font-bold tracking-tight mt-1 text-destructive">
            {store.auditLogs.filter(l => l.action === 'DELETE').length}
          </p>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search logs by ID, module, operator, or IP..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-border text-xs rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="text-xs bg-card border border-border text-foreground px-2 py-1.5 rounded-lg outline-none font-medium h-9 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Creates Only</option>
            <option value="UPDATE">Updates Only</option>
            <option value="DELETE">Purges Only</option>
          </select>

          {/* Module Filter */}
          <select
            value={moduleSelect}
            onChange={(e) => setModuleSelect(e.target.value)}
            className="text-xs bg-card border border-border text-foreground px-2 py-1.5 rounded-lg outline-none font-medium h-9 cursor-pointer"
          >
            <option value="ALL">All Directories</option>
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {(search || action !== 'ALL' || moduleSelect !== 'ALL') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSearch(''); setAction('ALL'); setModuleSelect('ALL'); }}
              className="text-xs text-muted-foreground h-9 px-3"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Logs Timelines */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-xs text-muted-foreground flex justify-between items-center">
          <span>Security Ledger Feed</span>
          <span>Showing {filteredLogs.length} items</span>
        </div>
        <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-muted/10 transition-colors space-y-3">
                {/* Header Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Color Coded Status */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase leading-none ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                      log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {log.action === 'DELETE' ? 'Purged' : log.action}
                    </span>
                    <span className="text-xs font-semibold text-foreground/90">{log.module}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {log.recordId}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Operator and Network Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4.5 w-4.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">
                      GD
                    </span>
                    <span>Operator: <span className="text-foreground font-semibold">Gabriel Dhillon</span></span>
                  </div>
                  <div>&bull;</div>
                  <div>IP Address: <span className="font-mono text-foreground font-semibold">{log.ipAddress || '127.0.0.1'}</span></div>
                </div>

                {/* Main Render Diff */}
                {renderDiff(log)}

                {/* System Details (Expandable) */}
                <details className="group border border-border/40 bg-card rounded-lg overflow-hidden text-xs">
                  <summary className="px-3 py-1.5 font-semibold text-[10px] text-muted-foreground uppercase cursor-pointer hover:bg-muted/30 select-none outline-none flex justify-between items-center transition-colors">
                    <span>System Metadata & Full State Dumps</span>
                    <span className="transition-transform group-open:rotate-180 font-mono text-[9px] text-muted-foreground">&darr;</span>
                  </summary>
                  <div className="p-3 border-t border-border/40 bg-muted/15 space-y-2">
                    <div className="text-[10px] text-muted-foreground truncate">
                      <span className="font-semibold text-foreground">User Agent:</span> {log.userAgent}
                    </div>
                    {log.newValue && (
                      <pre className="text-[9px] bg-muted/40 p-2.5 rounded border border-border/60 overflow-x-auto max-w-full font-mono leading-relaxed text-foreground">
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-4">
              <span className="text-sm font-bold text-muted-foreground">No operations matched your criteria.</span>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Try resetting the search terms or category selectors.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;
