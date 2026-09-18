import { EnvironmentConfig } from '../../types';

/**
 * QA environment configuration.
 *
 * Targets the ZincBank application under test.
 * Replace with the real QA URL if a separate one exists.
 */
export const qaConfig: EnvironmentConfig = {
  name: 'qa',
  baseUrl: 'https://zincbank.cydeo.io',
};
