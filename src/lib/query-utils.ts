/** True only on first load with no cached data — avoids full-page skeleton on navigation */
export function isInitialQueryLoad(isLoading: boolean, data: unknown): boolean {
  return isLoading && data === undefined;
}
