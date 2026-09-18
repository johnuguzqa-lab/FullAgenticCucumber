import * as dotenv from 'dotenv';
import { devConfig } from './environments/dev';
import { qaConfig } from './environments/qa';
import { stageConfig } from './environments/stage';
import { prodConfig } from './environments/prod';
import {
  AppConfig,
  BrowserName,
  EnvironmentConfig,
  EnvironmentName,
  ScreenshotMode,
  TraceMode,
  VideoMode,
} from '../types';

dotenv.config({ quiet: true });

const environmentConfigs: Record<EnvironmentName, EnvironmentConfig> = {
  dev: devConfig,
  qa: qaConfig,
  stage: stageConfig,
  prod: prodConfig,
};

const supportedBrowsers: readonly BrowserName[] = ['chromium', 'firefox', 'webkit'];
const supportedScreenshots: readonly ScreenshotMode[] = ['on', 'off', 'only-on-failure'];
const supportedVideos: readonly VideoMode[] = ['on', 'off', 'retain-on-failure'];
const supportedTraces: readonly TraceMode[] = ['on', 'off', 'retain-on-failure', 'on-first-retry'];

/** Returns the first non-empty env value or the provided fallback. */
function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim() !== '' ? value : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const rawEnv = readEnv('ENV', 'dev').toLowerCase();
const env: EnvironmentName = Object.prototype.hasOwnProperty.call(environmentConfigs, rawEnv)
  ? (rawEnv as EnvironmentName)
  : 'dev';
const environment = environmentConfigs[env];
const isCi = process.env.CI !== undefined && process.env.CI !== 'false';

/**
 * Central, typed configuration object.
 *
 * Consume `config` everywhere instead of touching `process.env` directly.
 */
export const config: AppConfig = {
  env,
  baseUrl: readEnv('BASE_URL', environment.baseUrl),
  apiBaseUrl: readEnv('API_BASE_URL', environment.apiBaseUrl ?? ''),
  browser: oneOf(readEnv('BROWSER', 'chromium').toLowerCase(), supportedBrowsers, 'chromium'),
  headless: parseBoolean(process.env.HEADLESS, true),
  timeout: parseNumber(process.env.TIMEOUT, 30000),
  retries:
    process.env.RETRIES !== undefined && process.env.RETRIES.trim() !== ''
      ? parseNumber(process.env.RETRIES, 1)
      : isCi
        ? 1
        : 0,
  workers: parseNumber(process.env.WORKERS, 1),
  screenshot: oneOf(readEnv('SCREENSHOT', 'only-on-failure').toLowerCase(), supportedScreenshots, 'only-on-failure'),
  video: oneOf(readEnv('VIDEO', 'off').toLowerCase(), supportedVideos, 'off'),
  trace: oneOf(readEnv('TRACE', 'on-first-retry').toLowerCase(), supportedTraces, 'on-first-retry'),
  username: readEnv('USERNAME', ''),
  password: readEnv('PASSWORD', ''),
};
