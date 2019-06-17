import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { json } from '@angular-devkit/core';

import { prepareBrowserConfig } from '../utils';

import { createConsoleLogServer } from './log-server';
import { CordovaServeBuilderSchema } from './schema';

export type CordovaDevServerBuilderOptions = CordovaServeBuilderSchema & json.JsonObject;

export async function serveCordova(
  options: CordovaServeBuilderSchema,
  context: BuilderContext
): Promise<BuilderOutput> {
  return new Promise(async () => {
    context.reportStatus(`running cordova serve...`);
    const { devServerTarget, cordovaBuildTarget, port, host, ssl } = options;

    // Getting the original browser build options
    const cordovaBuildTargetSpec = targetFromTargetString(cordovaBuildTarget);
    const cordovaBuildTargetOptions = await context.getTargetOptions(cordovaBuildTargetSpec) as { browserTarget: string };
    const browserBuildTargetSpec = targetFromTargetString(cordovaBuildTargetOptions.browserTarget);

    // What we actually need....
    const browserBuildTargetOptions = await context.getTargetOptions(browserBuildTargetSpec);

    // Modifying those options to pass in cordova-speicfic stuff
    prepareBrowserConfig(options, browserBuildTargetOptions);

    if (options.consolelogs && options.consolelogsPort) {
      await createConsoleLogServer(host, options.consolelogsPort);
    }

    const devServerTargetSpec = targetFromTargetString(devServerTarget);
    const devServerTargetOptions = await context.getTargetOptions(devServerTargetSpec);

    return context
      .scheduleTarget(devServerTargetSpec, { host, port, ssl }, devServerTargetOptions)
      .then(buildEvent => ({ ...buildEvent }));
  });
}
export default createBuilder<CordovaDevServerBuilderOptions, any>(serveCordova);
