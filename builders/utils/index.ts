import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { writeFileSync } from 'fs';

import { CordovaBuildBuilderSchema } from '../cordova-build/schema';
import { CordovaServeBuilderSchema } from '../cordova-serve/schema';

export function validateBuilderConfig(
  builderOptions: CordovaBuildBuilderSchema
) {
  // if we're mocking cordova.js, don't build cordova bundle
  const newOptions = { ...builderOptions };
  if (newOptions.cordovaMock) {
    newOptions.cordovaAssets = true;
  }

  if (builderOptions.cordovaAssets && !builderOptions.platform) {
    throw new Error(
      'The `--platform` option is required with `--cordova-assets`'
    );
  }
  return newOptions;
}

export function prepareBrowserConfig(
  options: CordovaBuildBuilderSchema | CordovaServeBuilderSchema | any,
  browserOptions: any
) {
  const optionsStarter = { ...browserOptions };
  const cordovaBasePath = normalize(
    options.cordovaBasePath ? options.cordovaBasePath : '.'
  );

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

  if (options.consolelogs) {
    // Write the config to a file, and then include that in the bundle so it loads on window
    const configPath = getSystemPath(
      join(
        normalize(__dirname),
        '../../assets',
        normalize('consolelog-config.js')
      )
    );
    writeFileSync(
      configPath,
      `window.Ionic = window.Ionic || {}; Ionic.ConsoleLogServerConfig = { wsPort: ${
        options.consolelogsPort
      } }`
    );
    if (optionsStarter.scripts) {
      optionsStarter.scripts.push({
        input: configPath,
        bundleName: 'consolelogs',
        lazy: false,
      });
      optionsStarter.scripts.push({
        input: getSystemPath(
          join(
            normalize(__dirname),
            '../../assets',
            normalize('consolelogs.js')
          )
        ),
        bundleName: 'consolelogs',
        lazy: false,
      });
    }
  }

  if (options.cordovaMock) {
    if (browserOptions.scripts) {
      browserOptions.scripts.push({
        input: getSystemPath(
          join(normalize(__dirname), '../../assets', normalize('cordova.js'))
        ),
        bundleName: 'cordova',
        lazy: false,
      });
    }
  } else if (options.cordovaAssets) {
    const platformWWWPath = join(
      cordovaBasePath,
      normalize(`platforms/${options.platform}/platform_www`)
    );

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
        lazy: false,
      });
    }
  }

  return optionsStarter;
}
