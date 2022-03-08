import type { Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';

const CONFIG_PATH = 'angular.json';

export function getDefaultAngularAppName(config: any): string {
  const projects = config.projects;
  const projectNames = Object.keys(projects);

  for (const projectName of projectNames) {
    const projectConfig = projects[projectName];
    if (isAngularBrowserProject(projectConfig)) {
      return projectName;
    }
  }

  return projectNames[0];
}

export function addArchitectBuilder(
  host: Tree,
  projectName: string,
  builderName: string,
  builderOpts: any
): void | never {
  const config = readConfig(host);
  const appConfig = getAngularAppConfig(config, projectName);
  appConfig.architect[builderName] = builderOpts;
  writeConfig(host, config);
}

export function readConfig(host: Tree): any {
  const sourceText = host.read(CONFIG_PATH)?.toString('utf-8');
  if (!sourceText) {
    return;
  }
  return JSON.parse(sourceText);
}

export function writeConfig(host: Tree, config: JSON): void {
  host.overwrite(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function isAngularBrowserProject(projectConfig: any): boolean {
  if (projectConfig.projectType === 'application') {
    const buildConfig = projectConfig.architect.build;
    return buildConfig.builder === '@angular-devkit/build-angular:browser';
  }

  return false;
}

export function getAngularAppConfig(config: any, projectName: string): any | never {
  // eslint-disable-next-line no-prototype-builtins
  if (!config.projects.hasOwnProperty(projectName)) {
    throw new SchematicsException(`Could not find project: ${projectName}`);
  }

  const projectConfig = config.projects[projectName];
  if (isAngularBrowserProject(projectConfig)) {
    return projectConfig;
  }

  if (config.projectType !== 'application') {
    throw new SchematicsException(`Invalid projectType for ${projectName}: ${config.projectType}`);
  } else {
    const buildConfig = projectConfig.architect.build;
    throw new SchematicsException(`Invalid builder for ${projectName}: ${buildConfig.builder}`);
  }
}
