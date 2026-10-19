import type { Request, Response } from 'express';
import { initDatabase } from '../src/server/db/pool.js';
import { createApp } from '../src/server/app.js';

let appInstance: ReturnType<typeof createApp> | null = null;

export default async function handler(req: Request, res: Response) {
  if (!appInstance) {
    await initDatabase();
    appInstance = createApp();
  }
  return appInstance(req, res);
}
