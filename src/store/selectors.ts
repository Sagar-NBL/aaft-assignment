import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectUserRole = (state: RootState) => state.auth.user?.role;
export const selectAuthLoading = (state: RootState) => state.auth.loading;

export const selectCourses = (state: RootState) => state.courses.courses;
export const selectSelectedCourse = (state: RootState) => state.courses.selectedCourse;
export const selectCoursesLoading = (state: RootState) => state.courses.loading;

export const selectStudents = (state: RootState) => state.students.students;
export const selectStudentsMeta = (state: RootState) => state.students.meta;
export const selectStudentsLoading = (state: RootState) => state.students.loading;

export const selectVideoProgress = (state: RootState) => state.progress.videoProgress;
export const selectCourseProgressMap = (state: RootState) => state.progress.courseProgress;

export const selectCourseProgressPercent = (courseId: string) =>
  createSelector(
    (state: RootState) => state.progress.courseProgress[courseId],
    (p) => p?.percentage ?? 0
  );

export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectNotifications = (state: RootState) => state.ui.notifications;

export const selectGlobalLoading = createSelector(
  selectAuthLoading,
  selectCoursesLoading,
  selectStudentsLoading,
  (auth, courses, students) => auth || courses || students
);

export const makeSelectFilteredStudentCourses = (
  search: string,
  status: 'all' | 'in_progress' | 'completed' | 'not_started'
) =>
  createSelector(
    (state: RootState) => state,
    () => {
      /* Used with RTK data in components; slice-based fallback */
      return { search, status };
    }
  );
