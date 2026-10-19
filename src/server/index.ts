import { config, isGeminiConfigured } from './config/env.js';
import { initDatabase } from './db/pool.js';
import { createApp } from './app.js';

async function bootstrap() {
  await initDatabase();
  const app = createApp();

  // Bind HTTP server to 0.0.0.0:$PORT (required for Render & containerized deployments)
  const port = Number(process.env.PORT) || config.PORT || 3001;
  app.listen(port, '0.0.0.0', () => {
    console.log('==============================================================');
    console.log(`🇬🇪 KARTULI DECK AI Server running on http://0.0.0.0:${port}`);
    console.log(
      `   Gemini API Mode: ${
        isGeminiConfigured()
          ? `LIVE (${config.GEMINI_IMAGE_MODEL})`
          : 'DEMO FALLBACK (Set GEMINI_API_KEY in .env for live generation)'
      }`
    );
    console.log('==============================================================');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Kartuli Deck AI server:', err);
  process.exit(1);
});
