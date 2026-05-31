import { PageLoading } from '@/components/common/PageLoading';

export default function StudentLoading() {
  return (
    <PageLoading
      heading="Student dashboard is loading"
      message="Fetching courses, progress, and lesson details. You’ll be on the next screen as soon as the data arrives."
    />
  );
}
