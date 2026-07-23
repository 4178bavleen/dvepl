import React from 'react';
import { useERPStore } from '@/store/erpStore';

export function SettingsPage() {
  const store = useERPStore();
  const [activeTab, setActiveTab] = React.useState('PROFILE');

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-muted-foreground/80">Global Settings</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Control Panel Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Side Tab Selectors */}
        <div className="bg-card border border-border rounded-xl p-2.5 shadow-sm space-y-1 h-fit">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
              activeTab === 'PROFILE' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Enterprise Profile
          </button>
          <button 
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
              activeTab === 'SECURITY' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            PRBAC Roles & Permissions
          </button>
          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
              activeTab === 'NOTIFICATIONS' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            System Logs & Analytics
          </button>
        </div>

        {/* Right Side Content Pane */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'PROFILE' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-tight text-foreground">Enterprise Metadata</h2>
              <div className="h-px bg-border my-2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enterprise Title</span>
                  <p className="text-xs font-semibold">Dhillon Valved Engineering Pvt Ltd</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registry GSTIN</span>
                  <p className="text-xs font-semibold">27AAAAA1111A1Z1</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Default Language</span>
                  <p className="text-xs font-semibold">{store.language} (English)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-bold tracking-tight text-foreground">PRBAC Role Hierarchy</h2>
                <div className="h-px bg-border my-2" />
                <div className="space-y-2.5">
                  {store.roles.map((role) => (
                    <div key={role.id} className="border border-border/80 rounded-xl p-3.5 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{role.name}</span>
                        {role.isSystem && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Core System</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold tracking-tight text-foreground">Active Policy Codes</h2>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-wrap gap-1.5">
                  {store.permissions.map((perm) => (
                    <span key={perm.id} className="text-[9px] font-semibold border border-border bg-card px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground transition-all select-none">
                      {perm.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-tight text-foreground">Telemetry & Analytics</h2>
              <div className="h-px bg-border my-2" />
              <p className="text-xs text-muted-foreground leading-normal">
                This dashboard runs completely on client-side simulation. Zustand state acts as the memory buffer, writing transaction changes to index database structures for sandbox safety.
              </p>
              <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Zustand Buffer size</span>
                  <span className="font-mono text-[10px]">{JSON.stringify(store).length} Bytes</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Prisma Schema Models</span>
                  <span className="font-mono text-[10px]">26 Entities</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
