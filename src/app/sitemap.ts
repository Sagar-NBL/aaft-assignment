import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://aaft.com', lastModified: new Date() },
    { url: 'https://aaft.com/login', lastModified: new Date() },
    { url: 'https://aaft.com/dashboard', lastModified: new Date() },
    { url: 'https://aaft.com/dashboard/courses', lastModified: new Date() },
    { url: 'https://aaft.com/dashboard/analytics', lastModified: new Date() },
    { url: 'https://aaft.com/dashboard/students', lastModified: new Date() },
    { url: 'https://aaft.com/dashboard/reports', lastModified: new Date() },
    { url: 'https://aaft.com/student', lastModified: new Date() },
  ];
}
