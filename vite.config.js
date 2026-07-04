import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the BAG Scoreboard template.
// During local development, `npm run dev` proxies /api requests to a
// locally running `vercel dev` server (port 3000) so the serverless
// Google Sheets function behaves the same locally as it does on Vercel.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
