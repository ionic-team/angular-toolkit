import {
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import type { BuilderContext } from '@angular-devkit/architect';
import { executeDevServerBuilder } from '@angular-devkit/build-angular';
import type { ExecutionTransformer } from '@angular-devkit/build-angular';
import type {
  DevServerBuilderOptions,
  DevServerBuilderOutput,
} from '@angular-devkit/build-angular/src/dev-server';
import type { IndexHtmlTransform } from '@angular-devkit/build-angular/src/utils/index-file/index-html-generator';
import { ScriptsWebpackPlugin } from '@angular-devkit/build-angular/src/webpack/plugins';
import type { json } from '@angular-devkit/core';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import { basename } from 'path';
import { from } from 'rxjs';
import type { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { Configuration } from 'webpack';

import { prepareServerConfig } from '../utils';
import type { FormattedAssets } from '../utils';
import { augmentIndexHtml } from '../utils/append-scripts';

import { createConsoleLogServer } from './log-server';
import type { CordovaServeBuilderSchema } from './schema';

export type CordovaDevServerBuilderOptions = CordovaServeBuilderSchema &
  json.JsonObject;

export function serveCordova(
  options: CordovaServeBuilderSchema,
  context: BuilderContext,
): Observable<DevServerBuilderOutput> {
  const { devServerTarget, port, host, ssl } = options;
  const root = context.workspaceRoot;
  const devServerTargetSpec = targetFromTargetString(devServerTarget);

  async function setup() {
    const devServerTargetOptions = (await context.getTargetOptions(
      devServerTargetSpec,
    )) as DevServerBuilderOptions;
    const devServerName = await context.getBuilderNameForTarget(
      devServerTargetSpec,
    );

    devServerTargetOptions.port = port;
    devServerTargetOptions.host = host;
    devServerTargetOptions.ssl = ssl;
    // tslint:disable-next-line: no-unnecessary-type-assertion
    const formattedOptions = (await context.validateOptions(
      devServerTargetOptions,
      devServerName,
    )) as DevServerBuilderOptions;
    const formattedAssets = prepareServerConfig(options, root);
    if (options.consolelogs && options.consolelogsPort) {
      await createConsoleLogServer(host, options.consolelogsPort);
    }
    return { formattedOptions, formattedAssets };
  }

  return from(setup()).pipe(
    switchMap(({ formattedOptions, formattedAssets }) =>
      executeDevServerBuilder(
        formattedOptions,
        context,
        getTransforms(formattedAssets, context),
      ),
    ),
  );
}
export default createBuilder<CordovaDevServerBuilderOptions, any>(serveCordova);

function getTransforms(
  formattedAssets: FormattedAssets,
  context: BuilderContext,
) {
  return {
    webpackConfiguration: cordovaServeTransform(formattedAssets, context),
    indexHtml: indexHtmlTransformFactory(formattedAssets, context),
  };
}

const cordovaServeTransform: (
  formattedAssets: FormattedAssets,
  context: BuilderContext,
) => ExecutionTransformer<Configuration> =
  (formattedAssets, { workspaceRoot }) =>
  browserWebpackConfig => {
    const scriptExtras = formattedAssets.globalScriptsByBundleName.map(
      (script: { bundleName: any; paths: any }) => {
        const bundleName = script.bundleName;
        return new ScriptsWebpackPlugin({
          name: bundleName,
          sourceMap: true,
          filename: `${basename(bundleName)}.js`,
          scripts: script.paths,
          basePath: workspaceRoot,
        });
      },
    );

    const copyWebpackPluginInstance = new CopyWebpackPlugin({
      patterns: formattedAssets.copyWebpackPluginPatterns,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    browserWebpackConfig.plugins!.push(
      ...scriptExtras,
      copyWebpackPluginInstance,
    );
    return browserWebpackConfig;
  };

export const indexHtmlTransformFactory: (
  formattedAssets: FormattedAssets,
  context: BuilderContext,
) => IndexHtmlTransform =
  ({ globalScriptsByBundleName }) =>
  (indexTransform: string) => {
    const augmentedHtml = augmentIndexHtml(
      indexTransform,
      globalScriptsByBundleName,
    );
    return Promise.resolve(augmentedHtml);
  };
