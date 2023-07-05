import type { AssetPatternClass } from '@angular-devkit/build-angular/src/builders/browser/schema';
import { normalizeExtraEntryPoints } from '@angular-devkit/build-angular/src/tools/webpack/utils/helpers';
import type { JsonObject } from '@angular-devkit/core';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { writeFileSync } from 'fs';
import { posix, resolve } from 'path';

import type { CordovaBuildBuilderSchema } from '../cordova-build/schema';
import type { CordovaServeBuilderSchema } from '../cordova-serve/schema';

export function validateBuilderConfig(builderOptions: CordovaBuildBuilderSchema): CordovaBuildBuilderSchema {
  // if we're mocking cordova.js, don't build cordova bundle
  const newOptions = { ...builderOptions };
  if (newOptions.cordovaMock) {
    newOptions.cordovaAssets = true;
  }

  if (builderOptions.cordovaAssets && !builderOptions.platform) {
    throw new Error('The `--platform` option is required with `--cordova-assets`');
  }
  return newOptions;
}

export function prepareBrowserConfig(
  options: CordovaBuildBuilderSchema | CordovaServeBuilderSchema | any,
  browserOptions: any
): JsonObject {
  const optionsStarter = { ...browserOptions };
  const cordovaBasePath = normalize(options.cordovaBasePath ? options.cordovaBasePath : '.');

  if (typeof options.sourceMap !== 'undefined') {
    optionsStarter.sourceMap = options.sourceMap;
  }

  // We always need to output the build to `www` because it is a hard
  // requirement of Cordova.
  if ('outputPath' in options) {
    optionsStarter.outputPath = join(cordovaBasePath, normalize('www'));
  }

  // Cordova CLI will error if `www` is missing. The Angular CLI deletes it
  // by default. Let's keep it around.
  if ('deleteOutputPath' in options) {
    optionsStarter.deleteOutputPath = false;
  }

  // Initialize an empty script array to make sure assets are pushed even when
  // scripts is not configured in angular.json
  if (!optionsStarter.scripts) {
    optionsStarter.scripts = [];
  }

  if (options.consolelogs) {
    // Write the config to a file, and then include that in the bundle so it loads on window
    const configPath = getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelog-config.js')));
    writeFileSync(
      configPath,
      `window.Ionic = window.Ionic || {}; Ionic.ConsoleLogServerConfig = { wsPort: ${options.consolelogsPort} }`
    );
    optionsStarter.scripts.push({
      input: configPath,
      bundleName: 'consolelogs',
    });
    optionsStarter.scripts.push({
      input: getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelogs.js'))),
      bundleName: 'consolelogs',
    });
  }

  if (options.cordovaMock) {
    if (browserOptions.scripts) {
      browserOptions.scripts.push({
        input: getSystemPath(join(normalize(__dirname), '../assets', normalize('cordova.js'))),
        bundleName: 'cordova',
      });
    }
  } else if (options.cordovaAssets) {
    const platformWWWPath = join(cordovaBasePath, normalize(`platforms/${options.platform}/platform_www`));

    // Add Cordova www assets that were generated whenever platform(s) and
    // plugin(s) are added. This includes `cordova.js`,
    // `cordova_plugins.js`, and all plugin JS.
    if (optionsStarter.assets) {
      optionsStarter.assets.push({
        glob: '**/*',
        input: getSystemPath(platformWWWPath),
        output: './',
      });
    }

    // Register `cordova.js` as a global script so it is included in
    // `index.html`.
    if (optionsStarter.scripts) {
      optionsStarter.scripts.push({
        input: getSystemPath(join(platformWWWPath, normalize('cordova.js'))),
        bundleName: 'cordova',
      });
    }
  }

  return optionsStarter;
}

export interface GlobalScriptsByBundleName {
  bundleName: string;
  paths: string[];
  inject: boolean;
}
export interface FormattedAssets {
  globalScriptsByBundleName: GlobalScriptsByBundleName[];

  copyWebpackPluginPatterns: any[];
}
export function prepareServerConfig(options: CordovaServeBuilderSchema, root: string): FormattedAssets {
  const scripts = [];
  const assets = [];
  const cordovaBasePath = normalize(options.cordovaBasePath ? options.cordovaBasePath : '.');
  if (options.consolelogs) {
    // Write the config to a file, and then include that in the bundle so it loads on window
    const configPath = getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelog-config.js')));
    writeFileSync(
      configPath,
      `window.Ionic = window.Ionic || {}; Ionic.ConsoleLogServerConfig = { wsPort: ${options.consolelogsPort} }`
    );
    scripts.push({ input: configPath, bundleName: 'consolelogs' });
    scripts.push({
      input: getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelogs.js'))),
      bundleName: 'consolelogs',
    });
  }
  if (options.cordovaMock) {
    scripts.push({
      input: getSystemPath(join(normalize(__dirname), '../assets', normalize('cordova.js'))),
      bundleName: 'cordova',
    });
  } else if (options.cordovaAssets) {
    const platformWWWPath = join(cordovaBasePath, normalize(`platforms/${options.platform}/platform_www`));
    assets.push({
      glob: '**/*',
      input: getSystemPath(platformWWWPath),
      output: './',
    });
    scripts.push({
      input: getSystemPath(join(platformWWWPath, normalize('cordova.js'))),
      bundleName: 'cordova',
    });
  }

  const globalScriptsByBundleName = normalizeExtraEntryPoints(scripts, 'scripts').reduce(
    (prev: { bundleName: string; paths: string[]; inject: boolean }[], curr) => {
      const { bundleName, inject, input } = curr;
      const resolvedPath = resolve(root, input);
      const existingEntry = prev.find((el) => el.bundleName === bundleName);
      if (existingEntry) {
        existingEntry.paths.push(resolvedPath);
      } else {
        prev.push({
          bundleName,
          inject,
          paths: [resolvedPath],
        });
      }
      return prev;
    },
    []
  );

  const copyWebpackPluginPatterns = assets.map((asset: AssetPatternClass) => {
    // Resolve input paths relative to workspace root and add slash at the end.
    // eslint-disable-next-line prefer-const
    let { input, output, ignore = [], glob } = asset;
    input = resolve(root, input).replace(/\\/g, '/');
    input = input.endsWith('/') ? input : input + '/';
    output = output.endsWith('/') ? output : output + '/';

    return {
      context: input,
      // Now we remove starting slash to make Webpack place it from the output root.
      to: output.replace(/^\//, ''),
      from: glob,
      noErrorOnMissing: true,
      globOptions: {
        dot: true,
        ignore: [
          '.gitkeep',
          '**/.DS_Store',
          '**/Thumbs.db',
          // Negate patterns needs to be absolute because copy-webpack-plugin uses absolute globs which
          // causes negate patterns not to match.
          // See: https://github.com/webpack-contrib/copy-webpack-plugin/issues/498#issuecomment-639327909
          ...ignore,
        ].map((i) => posix.join(input, i)),
      },
    };
  });

  return { globalScriptsByBundleName, copyWebpackPluginPatterns };
}
