/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

if (process.env.VERCEL === '1') {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const isPreview = process.env.VERCEL_ENV === 'preview';
  if ((isProduction || isPreview) && (!apiUrl || apiUrl.includes('localhost'))) {
    throw new Error(
      'NEXT_PUBLIC_API_URL must be set to the deployed sandbox API HTTPS URL before Vercel builds. See docs/DEPLOYMENT.md.',
    );
  }
}

const nextConfig = {
  transpilePackages: ['@rupeeroute/design-system', '@rupeeroute/api-contracts'],
};

export default nextConfig;
