import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';



import { AUTH_KEY } from '@/lib/auth-storage';

import { getLastRole } from '@/lib/last-role-storage';

import {

  applyMutationToStorage,

  bootstrapStorageAfterMutation,

  isMockDbMutatingRequest,

} from '@/lib/mock-db-patch';

import {

  commitLocalSnapshotToServer,

  ensureMockDbHydrated,

  scheduleMockDbPersist,

  SKIP_MOCK_HYDRATE_HEADER,

} from '@/lib/mock-db-sync';



export const apiClient = axios.create({

  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',

  headers: { 'Content-Type': 'application/json' },

  timeout: 15000,

});



apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {

  if (typeof window !== 'undefined') {

    const url = config.url ?? '';

    const skipHydrate =

      url.includes('/mock/state') ||

      url.includes('/auth/') ||

      config.headers?.[SKIP_MOCK_HYDRATE_HEADER] === '1';

    if (!skipHydrate) {

      await ensureMockDbHydrated();

    }



    const raw = localStorage.getItem(AUTH_KEY);

    if (raw) {

      try {

        const { token } = JSON.parse(raw) as { token: string };

        if (token) config.headers.Authorization = `Bearer ${token}`;

      } catch {

        /* ignore */

      }

    }

  }

  return config;

});



apiClient.interceptors.response.use(

  async (res) => {

    if (typeof window !== 'undefined') {

      const url = res.config.url ?? '';

      const method = res.config.method?.toLowerCase();



      if (isMockDbMutatingRequest(method, url)) {

        applyMutationToStorage(method, url, res.data, res.config.data);

        await bootstrapStorageAfterMutation();

        await commitLocalSnapshotToServer();

      } else {

        scheduleMockDbPersist(method, url);

      }

    }

    return res;

  },

  (error: AxiosError<{ message?: string }>) => {

    const message = error.response?.data?.message ?? error.message ?? 'Request failed';

    if (error.response?.status === 401 && typeof window !== 'undefined') {

      localStorage.removeItem(AUTH_KEY);

      if (!window.location.pathname.startsWith('/login')) {

        const role = getLastRole();

        window.location.href = role === 'student' ? '/login?role=student' : '/login?role=admin';

      }

    }

    return Promise.reject(new Error(message));

  }

);



export { AUTH_KEY } from '@/lib/auth-storage';

