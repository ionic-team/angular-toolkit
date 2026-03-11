import { createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import type { BuilderContext } from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { executeDevServerBuilder } from '@angular/build';
import type { DevServerBuilderOptions, DevServerBuilderOutput } from '@angular/build';
import type { json } from '@angular-devkit/core';
import { existsSync, readFileSync, statSync, writeFileSync } from 'fs';
import type * as http from 'http';
import { extname, resolve } from 'path';
import { from } from 'rxjs';
import type { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { GlobalScriptsByBundleName } from '../utils';
import { augmentIndexHtml } from '../utils/append-scripts';
import { createConsoleLogServer } from '../utils/log-server';
import type { CordovaServeBuilderSchema } from './schema';

export type CordovaDevServerBuilderOptions = CordovaServeBuilderSchema & json.JsonObject;

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.map': 'text/plain',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export function serveCordova(options: CordovaServeBuilderSchema, context: BuilderContext): Observable<DevServerBuilderOutput> {
  const { devServerTarget, port, host, ssl } = options;
  const root = context.workspaceRoot;
  const devServerTargetSpec = targetFromTargetString(devServerTarget);

  async function setup() {
    const devServerTargetOptions = await context.getTargetOptions(devServerTargetSpec);
    const devServerName = await context.getBuilderNameForTarget(devServerTargetSpec);
    console.log(devServerTargetOptions, devServerName);

    // console.log(devServerTargetOptions);

    devServerTargetOptions.port = port;
    devServerTargetOptions.host = host;
    devServerTargetOptions.ssl = ssl;


    // delete devServerTargetOptions.serviceWorker;


    const formattedOptions = await context.validateOptions<DevServerBuilderOptions & json.JsonObject>(devServerTargetOptions, devServerName);
    const serverAssets = prepareEsbuildServerConfig(options, root);

    if (options.consolelogs && options.consolelogsPort) {
      await createConsoleLogServer(host, options.consolelogsPort);
    }

    return { formattedOptions, serverAssets };
  }

  return from(setup()).pipe(
    switchMap(({ formattedOptions, serverAssets }) =>
      from(
        executeDevServerBuilder(formattedOptions as unknown as DevServerBuilderOptions, context as any, {
          middleware: buildMiddleware(serverAssets),
          indexHtmlTransformer: indexHtmlTransformFactory(serverAssets),
        })
      )
    )
  );
}

export default createBuilder<CordovaDevServerBuilderOptions, any>(serveCordova);

function buildMiddleware(
  serverAssets: EsbuildServerAssets
): ((req: http.IncomingMessage, res: http.ServerResponse, next: (err?: unknown) => void) => void)[] {
  const handlers: ((req: http.IncomingMessage, res: http.ServerResponse, next: (err?: unknown) => void) => void)[] = [];

  // Serve each script bundle at /{bundleName}.js by concatenating its source files
  for (const script of serverAssets.scripts) {
    const bundlePath = `/${script.bundleName}.js`;
    handlers.push((req, res, next) => {
      const reqPath = (req.url ?? '/').split('?')[0];
      if (reqPath === bundlePath) {
        const content = script.paths.map((p) => readFileSync(p, 'utf-8')).join('\n');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
        return;
      }
      next();
    });
  }

  // Serve static asset directories (e.g. cordova platform_www)
  for (const dir of serverAssets.staticDirs) {
    handlers.push((req, res, next) => {
      const urlPath = (req.url ?? '/').split('?')[0];
      const filePath = resolve(dir, urlPath.replace(/^\//, ''));
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(readFileSync(filePath));
        return;
      }
      next();
    });
  }

  return handlers;
}

export const indexHtmlTransformFactory: (serverAssets: EsbuildServerAssets) => (content: string) => Promise<string> =
  ({ scripts }) =>
  (indexHtml: string) =>
    Promise.resolve(augmentIndexHtml(indexHtml, scripts));


export interface EsbuildServerAssets {
  scripts: GlobalScriptsByBundleName[];
  staticDirs: string[];
}

export function prepareEsbuildServerConfig(options: CordovaServeBuilderSchema, root: string): EsbuildServerAssets {
  const rawScripts: { input: string; bundleName: string }[] = [];
  const staticDirs: string[] = [];
  const cordovaBasePath = normalize(options.cordovaBasePath ? options.cordovaBasePath : '.');

  if (options.consolelogs) {
    const configPath = getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelog-config.js')));
    writeFileSync(
      configPath,
      `window.Ionic = window.Ionic || {}; Ionic.ConsoleLogServerConfig = { wsPort: ${options.consolelogsPort} }`
    );
    rawScripts.push({ input: configPath, bundleName: 'consolelogs' });
    rawScripts.push({
      input: getSystemPath(join(normalize(__dirname), '../assets', normalize('consolelogs.js'))),
      bundleName: 'consolelogs',
    });
  }

  if (options.cordovaMock) {
    rawScripts.push({
      input: getSystemPath(join(normalize(__dirname), '../assets', normalize('cordova.js'))),
      bundleName: 'cordova',
    });
  } else if (options.cordovaAssets) {
    const platformWWWPath = join(cordovaBasePath, normalize(`platforms/${options.platform}/platform_www`));
    staticDirs.push(getSystemPath(platformWWWPath));
    rawScripts.push({
      input: getSystemPath(join(platformWWWPath, normalize('cordova.js'))),
      bundleName: 'cordova',
    });
  }

  const scripts = rawScripts.reduce((prev: GlobalScriptsByBundleName[], curr) => {
    const resolvedPath = resolve(root, curr.input);
    const existingEntry = prev.find((el) => el.bundleName === curr.bundleName);
    if (existingEntry) {
      existingEntry.paths.push(resolvedPath);
    } else {
      prev.push({ bundleName: curr.bundleName, inject: true, paths: [resolvedPath] });
    }
    return prev;
  }, []);

  return { scripts, staticDirs };
}
