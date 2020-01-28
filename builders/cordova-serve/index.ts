import {
  BuilderContext,
  createBuilder,
  targetFromTargetString
} from '@angular-devkit/architect';
import {
  ExecutionTransformer,
  executeDevServerBuilder
} from '@angular-devkit/build-angular';
import { ScriptsWebpackPlugin } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/scripts-webpack-plugin';
import { IndexHtmlTransform } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/index-file/write-index-html';
import {
  DevServerBuilderOptions,
  DevServerBuilderOutput
} from '@angular-devkit/build-angular/src/dev-server';
import { json } from '@angular-devkit/core';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import { basename } from 'path';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Configuration } from 'webpack';

import { FormattedAssets, prepareServerConfig } from '../utils';
import { augmentIndexHtml } from '../utils/append-scripts';

import { createConsoleLogServer } from './log-server';
import { CordovaServeBuilderSchema } from './schema';

export type CordovaDevServerBuilderOptions = CordovaServeBuilderSchema &
  json.JsonObject;

export function serveCordova(
  options: CordovaServeBuilderSchema,
  context: BuilderContext
): Observable<DevServerBuilderOutput> {
  const { devServerTarget, port, host, ssl } = options;

  const devServerTargetSpec = targetFromTargetString(devServerTarget);

  async function setup() {
    const devServerTargetOptions = (await context.getTargetOptions(
      devServerTargetSpec
    )) as DevServerBuilderOptions;
    devServerTargetOptions.port = port;
    devServerTargetOptions.host = host;
    devServerTargetOptions.ssl = ssl;
    const formattedAssets = prepareServerConfig(options);
    if (options.consolelogs && options.consolelogsPort) {
      await createConsoleLogServer(host, options.consolelogsPort);
    }
    return { devServerTargetOptions, formattedAssets };
  }

  return from(setup()).pipe(
    switchMap(({ devServerTargetOptions, formattedAssets }) =>
      executeDevServerBuilder(
        devServerTargetOptions,
        context,
        getTransforms(formattedAssets, context)
      )
    )
  );
}
export default createBuilder<CordovaDevServerBuilderOptions, any>(serveCordova);

function getTransforms(
  formattedAssets: FormattedAssets,
  context: BuilderContext
) {
  return {
    webpackConfiguration: cordovaServeTransform(formattedAssets, context),
    indexHtml: indexHtmlTransformFactory(formattedAssets, context),
  };
}

const cordovaServeTransform: (
  formattedAssets: FormattedAssets,
  context: BuilderContext
) => ExecutionTransformer<Configuration> = (
  formattedAssets,
  { workspaceRoot }
) => browserWebpackConfig => {
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
    }
  );

  const copyWebpackPluginOptions = {
    ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'],
  };
  const copyWebpackPluginInstance = new CopyWebpackPlugin(
    formattedAssets.copyWebpackPluginPatterns,
    copyWebpackPluginOptions
  );
  // tslint:disable-next-line: no-non-null-assertion
  browserWebpackConfig.plugins!.push(
    ...scriptExtras,
    copyWebpackPluginInstance
  );
  return browserWebpackConfig;
};

export const indexHtmlTransformFactory: (
  formattedAssets: FormattedAssets,
  context: BuilderContext
) => IndexHtmlTransform = ({ globalScriptsByBundleName }) => (
  indexTransform: string
) => {
  const augmentedHtml = augmentIndexHtml(
    indexTransform,
    globalScriptsByBundleName
  );
  return Promise.resolve(augmentedHtml);
};
