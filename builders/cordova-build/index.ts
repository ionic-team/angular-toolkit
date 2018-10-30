import { BuildEvent, Builder, BuilderConfiguration, BuilderContext, BuilderDescription } from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { Observable, of } from 'rxjs';
import { concatMap, tap, map } from 'rxjs/operators';

import { CordovaBuildBuilderSchema } from './schema';

export { CordovaBuildBuilderSchema };
import * as fs from 'fs';

export class CordovaBuildBuilder implements Builder<CordovaBuildBuilderSchema> {
  private buildConfig: any;
  constructor(public context: BuilderContext) {
    const architectConfigFile = fs.readFileSync(this.context.workspace.root + '/angular.json');
    const originalArchitectureConfig = JSON.parse(architectConfigFile.toString());
    this.buildConfig = originalArchitectureConfig.projects.app.architect.build;
  }

  run(builderConfig: BuilderConfiguration<CordovaBuildBuilderSchema>): Observable<BuildEvent> {
    let builderDescription: BuilderDescription;
    let customBuilderConfig: any;
    return this.context.architect.getBuilderDescription(this.buildConfig).pipe(
      tap(description => builderDescription = description),
      concatMap(() => this.buildBrowserConfig(builderConfig.options)),
      tap(generatedBrowserConfig =>  customBuilderConfig = generatedBrowserConfig),
      map(() => this.context.architect.getBuilder(builderDescription, this.context)),
      concatMap(builder => {
        return builder.run(customBuilderConfig)
      }),
    );
  }

  buildBrowserConfig(options: CordovaBuildBuilderSchema): Observable<BuilderConfiguration<any>> {
    let browserConfig: BuilderConfiguration<any>;

    return of(null).pipe(// tslint:disable-line:no-null-keyword
      concatMap(() => this._getBrowserConfig(options)),
      tap(config => browserConfig = config),
      tap(() => this.prepareBrowserConfig(options, browserConfig.options)),
      concatMap(() => of(browserConfig))
    );
  }

  // Mutates browserOptions
  prepareBrowserConfig(options: CordovaBuildBuilderSchema, browserOptions: any) {
    const cordovaBasePath = normalize(options.cordovaBasePath ? options.cordovaBasePath : '.');

    // We always need to output the build to `www` because it is a hard
    // requirement of Cordova.
    browserOptions.outputPath = join(cordovaBasePath, normalize('www'));

    if (options.cordovaAssets) {
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

  protected _getBrowserConfig(options: CordovaBuildBuilderSchema): Observable<BuilderConfiguration<any>> {
    const { architect } = this.context;
    const [ project, target, configuration ] = options.browserTarget.split(':');
    const browserTargetSpec = { project, target, configuration, overrides: {} };
    const builderConfig = architect.getBuilderConfiguration<any>(browserTargetSpec);

    return architect.getBuilderDescription(builderConfig).pipe(
      concatMap(browserDescription => architect.validateBuilderOptions(builderConfig, browserDescription))
    );
  }
}

export default CordovaBuildBuilder;
