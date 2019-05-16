import { BuilderContext, createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { json } from '@angular-devkit/core';

import { createConsoleLogServer } from './log-server';
import { CordovaServeBuilderSchema } from './schema';

export async function serveCordova(
  options: CordovaServeBuilderSchema,
  context: BuilderContext
) {
  return new Promise(async () => {
    context.reportStatus(`running cordova serve...`);
    const { devServerTarget, port, host, ssl } = options;
    const newOptions: any = { port, host, ssl };

    if (options.consolelogs && options.consolelogsPort) {
      await createConsoleLogServer(host, options.consolelogsPort);
    }

    const devServerTargetSpec = targetFromTargetString(devServerTarget);
    const devServerTargetOptions = await context.getTargetOptions(
      devServerTargetSpec
    );

    return context
      .scheduleTarget(devServerTargetSpec, newOptions, devServerTargetOptions)
      .then(buildEvent => ({ ...buildEvent }));
  });
}
export default createBuilder<json.JsonObject & CordovaServeBuilderSchema>(
  serveCordova
);
