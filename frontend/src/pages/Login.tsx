import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi, ApiError } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const data = await fetchApi<{ token: string; email: string; name: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? (err.detail || err.error) : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-[380px]">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <span className="text-[28px] font-display text-foreground font-normal">
            CareerOS
          </span>
          <p className="text-[13px] text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card text-foreground"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-2">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-6">
          No account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}