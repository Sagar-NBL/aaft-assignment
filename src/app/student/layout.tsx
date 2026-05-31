import { RouteGuard } from '@/components/common/RouteGuard';
import { StudentShell } from '@/components/common/StudentShell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard role="student">
      <StudentShell>{children}</StudentShell>
    </RouteGuard>
  );
}
