import { createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import type { json } from '@angular-devkit/core';

import { prepareBrowserConfig, validateBuilderConfig } from '../utils';

import type { CordovaBuildBuilderSchema } from './schema';

export async function buildCordova(
  options: CordovaBuildBuilderSchema,
  context: BuilderContext
): Promise<BuilderOutput> {
  context.reportStatus(`running cordova build...`);
  // Get angular browser build target
  const browserTargetSpec = targetFromTargetString(options.browserTarget);
  // Get browser build options
  const browserBuildTargetOptions = await context.getTargetOptions(browserTargetSpec);

  const formattedOptions = validateBuilderConfig(options);
  const newOptions = prepareBrowserConfig(formattedOptions, browserBuildTargetOptions);

  const browserBuild = await context.scheduleTarget(browserTargetSpec, newOptions);
  return browserBuild.result;
}

export default createBuilder<json.JsonObject & CordovaBuildBuilderSchema>(buildCordova);
