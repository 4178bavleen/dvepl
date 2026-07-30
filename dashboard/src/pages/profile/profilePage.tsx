import React, { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { authService, ProfileResponse } from '@/services/auth';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Building2,
  Lock,
  Loader2,
  FileKey2,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const store = useERPStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.profile();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
    } catch (err: any) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const updated = await authService.updateProfile(name.trim(), phone.trim());
      
      // Update local state
      setProfile(prev => prev ? { ...prev, name: updated.name, phone: updated.phone } : null);
      
      // Update global Zustand store
      const { users, currentUserId } = useERPStore.getState();
      const updatedUsers = users.map(u => u.id === currentUserId ? { ...u, name: updated.name, phone: updated.phone } : u);
      useERPStore.setState({ users: updatedUsers, currentUserName: updated.name });

      toast.success('Profile details updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Loading your account details...</p>
      </div>
    );
  }

  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'DU';
  const isAdmin = profile?.roles.some(role => role.toLowerCase().includes('admin')) || 
                  profile?.name?.toLowerCase().includes('admin');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Premium Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl md:text-2xl shadow-inner border border-primary/20">
            {initials}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{profile?.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {profile?.email}
            </p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {profile?.roles.map((r, i) => (
                <span key={i} className="text-[10px] uppercase font-extrabold tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 border-border pt-4 md:pt-0">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Account Status</div>
            <div className="flex items-center md:justify-end gap-1.5 mt-1 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> Active Verified Profile
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              logout();
              navigate('/login');
              toast.success('Logged out successfully.');
            }}
            className="h-8 px-4 gap-1.5 text-xs font-bold w-full md:w-auto mt-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border/80 pb-4">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {isAdmin ? 'Edit Personal Details' : 'Personal Details'}
              </h2>
            </div>
            
            <form onSubmit={isAdmin ? handleSave : (e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</div>
                  <div className="relative">
                    <Input
                      value={isAdmin ? name : (profile?.name || '')}
                      onChange={isAdmin ? (e) => setName(e.target.value) : undefined}
                      readOnly={!isAdmin}
                      className={`pl-9 h-10 text-xs font-semibold ${!isAdmin ? 'bg-muted/20 cursor-not-allowed opacity-80' : ''}`}
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    {!isAdmin && <Lock className="absolute right-3 top-3.5 h-3.5 w-3.5 text-muted-foreground/60" />}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</div>
                  <div className="relative">
                    <Input
                      value={isAdmin ? phone : (profile?.phone || '—')}
                      onChange={isAdmin ? (e) => setPhone(e.target.value) : undefined}
                      readOnly={!isAdmin}
                      className={`pl-9 h-10 text-xs font-semibold ${!isAdmin ? 'bg-muted/20 cursor-not-allowed opacity-80' : ''}`}
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    {!isAdmin && <Lock className="absolute right-3 top-3.5 h-3.5 w-3.5 text-muted-foreground/60" />}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</div>
                <div className="relative">
                  <Input
                    value={profile?.email || ''}
                    readOnly
                    className="pl-9 h-10 text-xs font-semibold bg-muted/20 cursor-not-allowed opacity-80"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Lock className="absolute right-3 top-3.5 h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
              </div>

              {isAdmin ? (
                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" className="h-9 px-5 gap-1.5 text-xs font-bold" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes
                      </>
                    ) : (
                      'Save Details'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/75" />
                  <span>Profile details are locked. To make updates, please contact your administrator.</span>
                </div>
              )}
            </form>
          </div>

          {/* Page Access Panel */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/80 pb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Authorized Access & Permissions</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Your role and custom page access control limits which features are accessible in the Dashboard:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile?.pageAccess && profile.pageAccess.length > 0 ? (
                  profile.pageAccess.map((page, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border px-2.5 py-1 rounded-md transition-all uppercase tracking-wider"
                    >
                      {page.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No customized page permissions mapped.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="space-y-6">
          {/* Job Details Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/80 pb-4">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Job Profile & Role</h2>
            </div>

            <div className="space-y-3.5 divide-y divide-border/60">
              <div className="pt-0">
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Designation</div>
                <div className="text-xs font-bold text-foreground mt-1">{profile?.designation || '—'}</div>
              </div>
              <div className="pt-3">
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Employee Code</div>
                <div className="text-xs font-bold text-foreground mt-1">{ (profile as any)?.employeeCode || '—' }</div>
              </div>
              <div className="pt-3">
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Department</div>
                <div className="text-xs font-bold text-foreground mt-1">{(profile as any)?.department?.name || '—'}</div>
              </div>
              <div className="pt-3">
                <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Registered Branch</div>
                <div className="text-xs font-bold text-foreground mt-1">{(profile as any)?.branch?.name || 'Main HQ / General'}</div>
              </div>
            </div>
          </div>

          {/* Company Details Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/80 pb-4">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Associated Company</h2>
            </div>

            {profile?.company ? (
              <div className="space-y-3.5 divide-y divide-border/60">
                <div className="pt-0">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Enterprise Name</div>
                  <div className="text-xs font-bold text-foreground mt-1">{profile.company.name}</div>
                </div>
                <div className="pt-3">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">GSTIN Number</div>
                  <div className="text-xs font-bold text-foreground mt-1">{(profile.company as any).gst || '—'}</div>
                </div>
                <div className="pt-3">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Office Address</div>
                  <div className="text-xs font-medium text-foreground mt-1">{(profile.company as any).address || '—'}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">No primary enterprise association mapped.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
