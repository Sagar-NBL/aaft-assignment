import { RouteGuard } from '@/components/common/RouteGuard';
import { AdminShell } from '@/components/common/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
