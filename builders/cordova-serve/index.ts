import { BuildEvent, Builder, BuilderConfiguration, BuilderContext, BuilderDescription } from '@angular-devkit/architect';
import { NormalizedBrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { DevServerBuilder, DevServerBuilderOptions } from '@angular-devkit/build-angular/src/dev-server';
import { Path, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import { Observable, from, of } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';

import { CordovaBuildBuilder, CordovaBuildBuilderSchema } from '../cordova-build';

import { createConsoleLogServer } from './log-server';
import { CordovaServeBuilderSchema } from './schema';

export class CordovaServeBuilder implements Builder<CordovaServeBuilderSchema> {
  constructor(public context: BuilderContext) {}

  run(builderConfig: BuilderConfiguration<CordovaServeBuilderSchema>): Observable<BuildEvent> {
    const { options: cordovaServeOptions } = builderConfig;
    const { devServerTarget, port, host, ssl } = cordovaServeOptions;
    const [ project, target, configuration ] = devServerTarget.split(':');

    const devServerTargetSpec = { project, target, configuration, overrides: { port, host, ssl } };
    const devServerBuilderConfig = this.context.architect.getBuilderConfiguration<DevServerBuilderOptions>(devServerTargetSpec);

    let devServerDescription: BuilderDescription;
    let cordovaBuildConfig: BuilderConfiguration<CordovaBuildBuilderSchema>;

    return of(null).pipe(
      concatMap(() => this.context.architect.getBuilderDescription(devServerBuilderConfig)),
      tap(description => devServerDescription = description),
      concatMap(() => this.context.architect.validateBuilderOptions(devServerBuilderConfig, devServerDescription)),
      concatMap(() => this._getCordovaBuildConfig(cordovaServeOptions)),
      tap(config => cordovaBuildConfig = config),
      concatMap(() => of(new CordovaDevServerBuilder(this.context, cordovaBuildConfig.options))),
      concatMap(builder => builder.run(devServerBuilderConfig))
    );
  }

  protected _getCordovaBuildConfig(cordovaServeOptions: CordovaServeBuilderSchema): Observable<BuilderConfiguration<CordovaBuildBuilderSchema>> {
    const { platform, cordovaBasePath, cordovaAssets, cordovaMock, consolelogs, consolelogsPort } = cordovaServeOptions;
    const [ project, target, configuration ] = cordovaServeOptions.cordovaBuildTarget.split(':');
    const cordovaBuildTargetSpec = { project, target, configuration, overrides: { platform, cordovaBasePath, cordovaAssets, cordovaMock, consolelogs, consolelogsPort } };
    const cordovaBuildTargetConfig = this.context.architect.getBuilderConfiguration<CordovaBuildBuilderSchema>(cordovaBuildTargetSpec);

    return this.context.architect.getBuilderDescription(cordovaBuildTargetConfig).pipe(
      concatMap(cordovaBuildDescription => this.context.architect.validateBuilderOptions(cordovaBuildTargetConfig, cordovaBuildDescription))
    );
  }
}

class CordovaDevServerBuilder extends DevServerBuilder {
  constructor(context: BuilderContext, public cordovaBuildOptions: CordovaBuildBuilderSchema) {
    super(context);
  }

  run(builderConfig: BuilderConfiguration<DevServerBuilderOptions>): Observable<BuildEvent> {
    if (this.cordovaBuildOptions.consolelogs && this.cordovaBuildOptions.consolelogsPort) {
      return from(createConsoleLogServer(builderConfig.options.host, this.cordovaBuildOptions.consolelogsPort))
        .pipe(_ => super.run(builderConfig));
    }
    return super.run(builderConfig);
  }

  buildWebpackConfig(root: Path, projectRoot: Path, host: virtualFs.Host<fs.Stats>, browserOptions: NormalizedBrowserBuilderSchema) {
    const builder = new CordovaBuildBuilder(this.context);
    builder.validateBuilderConfig(this.cordovaBuildOptions);
    builder.prepareBrowserConfig(this.cordovaBuildOptions, browserOptions);

    return super.buildWebpackConfig(root, projectRoot, host, browserOptions);
  }
}

export default CordovaServeBuilder;
