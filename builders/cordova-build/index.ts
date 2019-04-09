import { BuildEvent, Builder, BuilderConfiguration, BuilderContext, BuilderDescription } from '@angular-devkit/architect';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { writeFileSync } from 'fs';
import { Observable, of } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';

import { CordovaBuildBuilderSchema } from './schema';

export { CordovaBuildBuilderSchema };

export class CordovaBuildBuilder implements Builder<CordovaBuildBuilderSchema> {
  constructor(public context: BuilderContext) {}

  run(builderConfig: BuilderConfiguration<CordovaBuildBuilderSchema>): Observable<BuildEvent> {
    const [ project, target, configuration ] = builderConfig.options.browserTarget.split(':');
    const browserTargetSpec = { project, target, configuration, overrides: {} };

    let browserConfig = this.context.architect.getBuilderConfiguration<BrowserBuilderSchema>(browserTargetSpec);
    let browserDescription: BuilderDescription;

    return of(null).pipe(
      concatMap(() => this.context.architect.getBuilderDescription(browserConfig)),
      tap(description => browserDescription = description),
      concatMap(() => this.context.architect.validateBuilderOptions(browserConfig, browserDescription)),
      tap(config => browserConfig = config),
      tap(() => this.validateBuilderConfig(builderConfig.options)),
      tap(() => this.prepareBrowserConfig(builderConfig.options, browserConfig.options)),
      concatMap(() => of(this.context.architect.getBuilder(browserDescription, this.context))),
      concatMap(builder => builder.run(browserConfig))
    );
  }

  // Mutates builderOptions
  validateBuilderConfig(builderOptions: CordovaBuildBuilderSchema) {
    // if we're mocking cordova.js, don't build cordova bundle
    if (builderOptions.cordovaMock) {
      builderOptions.cordovaAssets = false;
    }

    if (builderOptions.cordovaAssets && !builderOptions.platform) {
      throw new Error('The `--platform` option is required with `--cordova-assets`');
    }
  }

  // Mutates browserOptions
  prepareBrowserConfig(options: CordovaBuildBuilderSchema, browserOptions: BrowserBuilderSchema) {
    const cordovaBasePath = normalize(options.cordovaBasePath ? options.cordovaBasePath : '.');

    if (typeof options.sourceMap !== 'undefined') {
      browserOptions.sourceMap = options.sourceMap;
    }

    // We always need to output the build to `www` because it is a hard
    // requirement of Cordova.
    browserOptions.outputPath = join(cordovaBasePath, normalize('www'));

    // Cordova CLI will error if `www` is missing. The Angular CLI deletes it
    // by default. Let's keep it around.
    browserOptions.deleteOutputPath = false;

    if (options.consolelogs) {
      // Write the config to a file, and then include that in the bundle so it loads on window
      const configPath = getSystemPath(join(normalize(__dirname), '../../assets', normalize('consolelog-config.js')));
      writeFileSync(configPath, `window.Ionic = window.Ionic || {}; Ionic.ConsoleLogServerConfig = { wsPort: ${options.consolelogsPort} }`);

      browserOptions.scripts.push({
        input: configPath,
        bundleName: 'consolelogs',
        lazy: false,
      });

      browserOptions.scripts.push({
        input: getSystemPath(join(normalize(__dirname), '../../assets', normalize('consolelogs.js'))),
        bundleName: 'consolelogs',
        lazy: false,
      });
    }

    if (options.cordovaMock) {
      browserOptions.scripts.push({
        input: getSystemPath(join(normalize(__dirname), '../../assets', normalize('cordova.js'))),
        bundleName: 'cordova',
        lazy: false,
      });
    } else if (options.cordovaAssets) {
      const platformWWWPath = join(cordovaBasePath, normalize(`platforms/${options.platform}/platform_www`));

      // Add Cordova www assets that were generated whenever platform(s) and
      // plugin(s) are added. This includes `cordova.js`,
      // `cordova_plugins.js`, and all plugin JS.
      browserOptions.assets.push({
        glob: '**/*',
        input: getSystemPath(platformWWWPath),
        output: './',
      });

      // Register `cordova.js` as a global script so it is included in
      // `index.html`.
      browserOptions.scripts.push({
        input: getSystemPath(join(platformWWWPath, normalize('cordova.js'))),
        bundleName: 'cordova',
        lazy: false,
      });
    }
  }
}

export default CordovaBuildBuilder;
