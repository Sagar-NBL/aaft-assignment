import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';
import type {
  AdminOverviewReport,
  Course,
  PaginatedResponse,
  Student,
  StudentCourseCard,
  StudentDashboardStats,
  StudentReport,
} from '@/types';

const axiosBaseQuery: BaseQueryFn<
  { url: string; method?: AxiosRequestConfig['method']; data?: unknown; params?: unknown },
  unknown,
  string
> = async ({ url, method = 'GET', data, params }) => {
  try {
    const result = await apiClient({ url, method, data, params });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError<{ message?: string }>;
    return { error: err.response?.data?.message ?? err.message ?? 'Error' };
  }
};

export const api = createApi({
  reducerPath: 'aaftApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Students', 'Courses', 'Enrollments', 'Reports', 'StudentReport', 'StudentCourses', 'StudentDashboard'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getStudents: builder.query<
      PaginatedResponse<Student>,
      { page?: number; limit?: number; search?: string; sort?: string }
    >({
      query: (params) => ({ url: '/admin/students', params }),
      providesTags: ['Students'],
    }),
    getStudent: builder.query<Student, string>({
      query: (id) => ({ url: `/admin/students/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Students', id }],
    }),
    getStudentReport: builder.query<StudentReport, string>({
      query: (id) => ({ url: `/admin/reports/students/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'StudentReport', id }, 'Reports'],
      // Shorter cache time for student reports to ensure fresh data after creation
      keepUnusedDataFor: 5,
    }),
    getAdminOverview: builder.query<AdminOverviewReport, void>({
      query: () => ({ url: '/admin/reports/overview' }),
      providesTags: ['Reports'],
    }),
    getCourses: builder.query<{ items: Course[] }, void>({
      query: () => ({ url: '/admin/courses' }),
      providesTags: ['Courses'],
    }),
    getCourse: builder.query<Course, string>({
      query: (id) => ({ url: `/admin/courses/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Courses', id }],
    }),
    getEnrollments: builder.query<
      {
        items: {
          id: string;
          studentName: string;
          courseName: string;
          progress: { percentage: number };
        }[];
      },
      void
    >({
      query: () => ({ url: '/admin/enrollments' }),
      providesTags: ['Enrollments'],
    }),
    assignEnrollments: builder.mutation<
      unknown,
      { studentIds: string[]; courseIds: string[] }
    >({
      query: (body) => ({ url: '/admin/enrollments', method: 'POST', data: body }),
      invalidatesTags: ['Enrollments', 'Students', 'StudentCourses'],
    }),
    createLesson: builder.mutation<
      unknown,
      { courseId: string; title: string; description: string; videoUrl: string; duration: number }
    >({
      query: ({ courseId, ...body }) => ({
        url: `/admin/courses/${courseId}/lessons`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Courses'],
    }),
    updateLesson: builder.mutation<
      unknown,
      { courseId: string; lessonId: string; updates: Record<string, unknown> }
    >({
      query: ({ courseId, lessonId, updates }) => ({
        url: `/admin/courses/${courseId}/lessons`,
        method: 'PATCH',
        data: { lessonId, ...updates },
      }),
      invalidatesTags: ['Courses'],
    }),
    deleteLesson: builder.mutation<unknown, { courseId: string; lessonId: string }>({
      query: ({ courseId, lessonId }) => ({
        url: `/admin/courses/${courseId}/lessons?lessonId=${lessonId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),
    getStudentCourses: builder.query<
      { items: StudentCourseCard[] },
      { search?: string; status?: string }
    >({
      query: (params) => ({ url: '/student/courses', params }),
      providesTags: ['StudentCourses'],
    }),
    getStudentCourseDetail: builder.query<
      {
        course: { id: string; name: string; description: string };
        progress: { percentage: number; completedVideos: number; totalVideos: number };
        lessons: {
          id: string;
          title: string;
          description: string;
          videoUrl: string;
          duration: number;
          progress: {
            lastWatched: number;
            percentage: number;
            isCompleted: boolean;
            watchedSegments?: [number, number][];
          };
        }[];
      },
      string
    >({
      query: (id) => ({ url: `/student/courses/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'StudentCourses', id }],
    }),
    getStudentDashboard: builder.query<StudentDashboardStats, void>({
      query: () => ({ url: '/student/dashboard' }),
      providesTags: ['StudentDashboard'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetStudentReportQuery,
  useGetAdminOverviewQuery,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetEnrollmentsQuery,
  useAssignEnrollmentsMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useGetStudentCoursesQuery,
  useGetStudentCourseDetailQuery,
  useGetStudentDashboardQuery,
} = api;
