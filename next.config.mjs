/** @type {import('next').NextConfig} */
const nextConfig = {

  typescript: {
    // Advertencia: Esto permite que el build termine incluso si hay errores de TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;