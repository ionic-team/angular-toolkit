import { BuildEvent, Builder, BuilderConfiguration, BuilderContext, BuilderDescription } from '@angular-devkit/architect';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { DevServerBuilder, DevServerBuilderOptions } from '@angular-devkit/build-angular/src/dev-server';
import { Path, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import { Observable, of } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';

import { CordovaBuildBuilder, CordovaBuildBuilderSchema } from '../cordova-build';

import { CordovaServeBuilderSchema } from './schema';

export class CordovaServeBuilder implements Builder<CordovaServeBuilderSchema> {
  constructor(public context: BuilderContext) {}

  run(builderConfig: BuilderConfiguration<CordovaServeBuilderSchema>): Observable<BuildEvent> {
    const { options: cordovaServeOptions } = builderConfig;
    const { devServerTarget, port, host, ssl, proxyConfig } = cordovaServeOptions;
    const [ project, target, configuration ] = devServerTarget.split(':');

    const devServerTargetSpec = { project, target, configuration, overrides: { port, host, ssl, proxyConfig } };
    const devServerBuilderConfig = this.context.architect.getBuilderConfiguration<DevServerBuilderOptions>(devServerTargetSpec);

    let devServerDescription: BuilderDescription;
    let cordovaBuildConfig: BuilderConfiguration<CordovaBuildBuilderSchema>;

    return this.context.architect.getBuilderDescription(devServerBuilderConfig).pipe(
      tap(description => devServerDescription = description),
      concatMap(() => this.context.architect.validateBuilderOptions(devServerBuilderConfig, devServerDescription)),
      concatMap(() => this._getCordovaBuildConfig(cordovaServeOptions)),
      tap(config => cordovaBuildConfig = config),
      concatMap(() => of(new CordovaDevServerBuilder(this.context, cordovaBuildConfig.options))),
      concatMap(builder => builder.run(devServerBuilderConfig))
    );
  }

  protected _getCordovaBuildConfig(cordovaServeOptions: CordovaServeBuilderSchema): Observable<BuilderConfiguration<CordovaBuildBuilderSchema>> {
    const { platform } = cordovaServeOptions;
    const [ project, target, configuration ] = cordovaServeOptions.cordovaBuildTarget.split(':');
    const cordovaBuildTargetSpec = { project, target, configuration, overrides: { platform } };
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

  buildWebpackConfig(root: Path, projectRoot: Path, host: virtualFs.Host<fs.Stats>, browserOptions: BrowserBuilderSchema) {
    const builder = new CordovaBuildBuilder(this.context);
    builder.prepareBrowserConfig(this.cordovaBuildOptions, browserOptions);

    return super.buildWebpackConfig(root, projectRoot, host, browserOptions);
  }
}

export default CordovaServeBuilder;
