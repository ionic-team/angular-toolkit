import type { Rule, Tree } from '@angular-devkit/schematics';
import { chain, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';

import { addArchitectBuilder, getDefaultAngularAppName } from './../utils/config';
import type { Schema as AddOptions } from './schema';

function addCordovaBuilder(projectName: string): Rule {
  return (host: Tree) => {
    addArchitectBuilder(host, projectName, 'ionic-cordova-serve', {
      builder: '@ionic/cordova-builders:cordova-serve',
      options: {
        cordovaBuildTarget: `${projectName}:ionic-cordova-build`,
        devServerTarget: `${projectName}:serve`,
      },
      configurations: {
        production: {
          cordovaBuildTarget: `${projectName}:ionic-cordova-build:production`,
          devServerTarget: `${projectName}:serve:production`,
        },
      },
    });
    addArchitectBuilder(host, projectName, 'ionic-cordova-build', {
      builder: '@ionic/cordova-builders:cordova-build',
      options: {
        browserTarget: `${projectName}:build`,
      },
      configurations: {
        production: {
          browserTarget: `${projectName}:build:production`,
        },
      },
    });
    return host;
  };
}

export default function ngAdd(options: AddOptions): Rule {
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    if (!options.project) {
      options.project = getDefaultAngularAppName(workspace);
    }
    const project = workspace.projects.get(options.project);

    if (!project || project.extensions.projectType !== 'application') {
      throw new SchematicsException(`Ionic Add requires a project type of "application".`);
    }

    return chain([addCordovaBuilder(options.project)]);
  };
}
