'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk } from '@/store/thunks/authThunks';
import { selectIsAuthenticated, selectUserRole } from '@/store/selectors';
import { loginSchema, type LoginFormValues } from '@/lib/validations';
import { getLastRole, setLastRole } from '@/lib/last-role-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const searchParams = useSearchParams();
  const roleParam = searchParams?.get('role');
  const activeRole = useMemo<'admin' | 'student'>(() => {
    if (roleParam === 'student') return 'student';
    if (roleParam === 'admin') return 'admin';
    return getLastRole() ?? 'admin';
  }, [roleParam]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@aaft.com', password: 'Admin@123' },
  });

  const isLoading = isSubmitting || isRedirecting;

  useEffect(() => {
    const email = activeRole === 'student' ? 'student@aaft.com' : 'admin@aaft.com';
    const password = activeRole === 'student' ? 'Student@123' : 'Admin@123';
    reset({ email, password });
  }, [activeRole, reset]);

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(role === 'admin' ? '/admin' : '/student/courses');
    }
  }, [isAuthenticated, role, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsRedirecting(true);
    const result = await dispatch(loginThunk(values));
    if (loginThunk.fulfilled.match(result)) {
      try {
        sessionStorage.setItem('aaft:pendingToast', 'login-success');
      } catch {
        /* ignore */
      }
      const r = result.payload.user.role;
      setLastRole(r);
      router.push(r === 'admin' ? '/admin' : '/student/courses');
      return;
    }
    setIsRedirecting(false);
    toast.error((result.payload as string) || 'Invalid credentials');
  };

  const switchHref = activeRole === 'admin' ? '/login?role=student' : '/login?role=admin';
  const switchLabel = activeRole === 'admin' ? 'Sign in as student instead?' : 'Sign in as admin instead?';

  return (
    <Card className="w-full max-w-md overflow-hidden border-[rgb(var(--border))] shadow-2xl shadow-black/20">
      <div className="h-1 w-full bg-gradient-to-r from-[rgb(var(--cta))] via-[rgb(var(--gold))] to-transparent" />
      <CardHeader>
        <CardTitle>Sign in to AAFT LMS</CardTitle>
        <CardDescription>
          {activeRole === 'admin' ? (
            <div className="text-sm text-[rgb(var(--muted-foreground))]">
              <p className="font-semibold text-[rgb(var(--gold))]">Admin portal</p>
              <p>admin@aaft.com / Admin@123</p>
            </div>
          ) : (
            <div className="text-sm text-[rgb(var(--muted-foreground))]">
              <p className="font-semibold text-[rgb(var(--gold))]">Student portal</p>
              <p>student@aaft.com / Student@123</p>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} disabled={isLoading} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} aria-invalid={!!errors.password} disabled={isLoading} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="gold" className="w-full min-h-10" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Signing in" />
            ) : (
              'Login'
            )}
          </Button>
          <p className="text-center text-sm">
            <Link href={switchHref} className="text-[rgb(var(--gold))] underline-offset-4 hover:underline">
              {switchLabel}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
