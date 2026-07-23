import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const markAuthenticated = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authService.login(email, password);
      markAuthenticated();
      setIsLoading(false);
      toast.success('Access authorized! Welcome to DVEPL ERP Dashboard.');
      navigate('/');
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.response?.data?.message ?? 'Unable to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white text-md font-bold mx-auto">
            D
          </div>
          <h1 className="text-lg font-bold tracking-tight">Enterprise Access</h1>
          <p className="text-xs text-muted-foreground">Sign in to manage DVEPL ERP resources</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9 border-border text-xs rounded-md"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
              <a href="#" className="text-[10px] text-primary hover:underline font-semibold">Forgot?</a>
            </div>
            <div className="relative">
              <Input 
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 border-border pr-9 text-xs rounded-md"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-9 bg-primary text-white text-xs font-semibold shadow-sm" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Authorized Personnel Only &bull; DVEPL Security Policy</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
