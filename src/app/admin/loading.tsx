import { PageLoading } from '@/components/common/PageLoading';

export default function AdminLoading() {
  return (
    <PageLoading
      heading="Admin portal is warming up"
      message="Loading your dashboard, analytics, and management tools. We’ll show the page as soon as the server finishes preparing it."
    />
  );
}
