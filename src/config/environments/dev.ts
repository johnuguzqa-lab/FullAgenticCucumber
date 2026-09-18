import { EnvironmentConfig } from '../../types';

/**
 * Dev environment configuration.
 *
 * Targets the ZincBank application used by the new project.
 * Replace with the real dev URL if a separate one exists.
 */
export const devConfig: EnvironmentConfig = {
  name: 'dev',
  baseUrl: 'https://zincbank.cydeo.io',
};
