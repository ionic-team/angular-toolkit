import type { Path } from '@angular-devkit/core';
import { join, normalize, strings } from '@angular-devkit/core';
import type { DirEntry, Rule, Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import type { ModuleOptions } from '@schematics/angular/utility/find-module';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import * as ts from 'typescript';

import { findNodes } from '../../util/ast-util';
import type { Change } from '../../util/change';
import { InsertChange } from '../../util/change';
import type { Schema as PageOptions } from '../schema';

export function findRoutingModuleFromOptions(host: Tree, options: ModuleOptions): Path | undefined {
  // eslint-disable-next-line no-prototype-builtins
  if (options.hasOwnProperty('skipImport') && options.skipImport) {
    return undefined;
  }

  if (!options.module) {
    const pathToCheck = (options.path || '') + (options.flat ? '' : '/' + strings.dasherize(options.name));

    return normalize(findRoutingModule(host, pathToCheck));
  } else {
    const modulePath = normalize('/' + options.path + '/' + options.module);
    const moduleBaseName = normalize(modulePath).split('/').pop();

    if (host.exists(modulePath)) {
      return normalize(modulePath);
    } else if (host.exists(modulePath + '.ts')) {
      return normalize(modulePath + '.ts');
    } else if (host.exists(modulePath + '.module.ts')) {
      return normalize(modulePath + '.module.ts');
    } else if (host.exists(modulePath + '/' + moduleBaseName + '.module.ts')) {
      return normalize(modulePath + '/' + moduleBaseName + '.module.ts');
    } else {
      throw new Error('Specified module does not exist');
    }
  }
}

export function findRoutingModule(host: Tree, generateDir: string): Path {
  let dir: DirEntry | null = host.getDir('/' + generateDir);

  const routingModuleRe = /-routing\.module\.ts/;

  while (dir) {
    const matches = dir.subfiles.filter((p) => routingModuleRe.test(p));

    if (matches.length === 1) {
      return join(dir.path, matches[0]);
    } else if (matches.length > 1) {
      throw new Error(
        'More than one module matches. Use skip-import option to skip importing the component into the closest module.'
      );
    }

    dir = dir.parent;
  }

  throw new Error('Could not find an NgModule. Use the skip-import option to skip importing in NgModule.');
}

export function addRouteToNgModule(options: PageOptions): Rule {
  const { module } = options;

  if (!module) {
    throw new SchematicsException('module option is required.');
  }

  return (host) => {
    const text = host.read(module);

    if (!text) {
      throw new SchematicsException(`File ${module} does not exist.`);
    }

    const sourceText = text.toString('utf8');
    const source = ts.createSourceFile(module, sourceText, ts.ScriptTarget.Latest, true);

    const pagePath =
      `/${options.path}/` +
      (options.flat ? '' : `${strings.dasherize(options.name)}/`) +
      `${strings.dasherize(options.name)}.module`;

    const relativePath = buildRelativePath(module, pagePath);

    const routePath = strings.dasherize(options.routePath ? options.routePath : options.name);
    const ngModuleName = `${strings.classify(options.name)}PageModule`;
    const changes = addRouteToRoutesArray(source, module, routePath, relativePath, ngModuleName);
    const recorder = host.beginUpdate(module);

    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }

    host.commitUpdate(recorder);

    return host;
  };
}

/**
 * Inserts `routeEntry` into the `routes` array literal in `source`, keeping the file's existing
 * trailing-comma style. Pass the route object indented and without a trailing comma.
 */
function insertRouteEntry(source: ts.SourceFile, filePath: string, routeEntry: string): Change[] {
  const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);

  for (const keyword of keywords) {
    if (!ts.isVariableStatement(keyword)) {
      continue;
    }

    const [declaration] = keyword.declarationList.declarations;

    if (!ts.isVariableDeclaration(declaration) || !declaration.initializer || declaration.name.getText() !== 'routes') {
      continue;
    }

    // Only an array literal can be appended to. Anything else, like a helper call or an
    // imported constant, gets left alone so we don't corrupt the file.
    if (!ts.isArrayLiteralExpression(declaration.initializer)) {
      return [];
    }

    const lastRouteNode = declaration.initializer.getChildAt(1).getLastToken();

    if (!lastRouteNode) {
      const closeBracket = declaration.initializer.getLastToken();

      if (!closeBracket) {
        return [];
      }

      // An empty array has no element to anchor to, so insert before the closing bracket.
      return [new InsertChange(filePath, closeBracket.getStart(), `\n${routeEntry},\n`)];
    }

    const changes: Change[] = [];
    const trailingCommaFound = lastRouteNode.kind === ts.SyntaxKind.CommaToken;

    if (!trailingCommaFound) {
      changes.push(new InsertChange(filePath, lastRouteNode.getEnd(), ','));
    }

    changes.push(
      new InsertChange(filePath, lastRouteNode.getEnd() + 1, `${routeEntry}${trailingCommaFound ? ',' : ''}\n`)
    );

    return changes;
  }

  return [];
}

export function addRouteToRoutesArray(
  source: ts.SourceFile,
  ngModulePath: string,
  routePath: string,
  routeLoadChildren: string,
  ngModuleName: string
): Change[] {
  return insertRouteEntry(
    source,
    ngModulePath,
    `  {\n    path: '${routePath}',\n    loadChildren: () => import('${routeLoadChildren}').then( m => m.${ngModuleName})\n  }`
  );
}

// Standalone functions
export function addRouteToRoutesFile(
  source: ts.SourceFile,
  routesFilePath: string,
  routePath: string,
  relativePath: string,
  componentName: string
): Change[] {
  return insertRouteEntry(
    source,
    routesFilePath,
    `  {\n    path: '${routePath}',\n    loadComponent: () => import('${relativePath}').then( m => m.${componentName})\n  }`
  );
}

export function findRoutesFile(host: Tree, options: PageOptions): Path | null {
  const pathToCheck = (options.path || '') + (options.flat ? '' : '/' + strings.dasherize(options.name));
  let dir: DirEntry | null = host.getDir('/' + pathToCheck);
  const routesRe = /.routes\.ts/;

  while (dir) {
    const matches = dir.subfiles.filter((p) => routesRe.test(p));
    if (matches.length === 1) {
      return join(dir.path, matches[0]);
    } else if (matches.length > 1) {
      throw new Error('Could not find your routes file. Use the skip-import option to skip importing.');
    }
    dir = dir.parent;
  }
  throw new Error('Could not find your routes file. Use the skip-import option to skip importing.');
}

export function addRoute(options: PageOptions): Rule {
  return (host) => {
    const routesFile = findRoutesFile(host, options) as string;
    const text = host.read(routesFile);
    if (!text) {
      throw new SchematicsException(`File ${routesFile} does not exist.`);
    }
    //
    const sourceText = text.toString('utf8');
    const source = ts.createSourceFile(routesFile, sourceText, ts.ScriptTarget.Latest, true);

    const pagePath =
      `/${options.path}/` +
      (options.flat ? '' : `${strings.dasherize(options.name)}/`) +
      `${strings.dasherize(options.name)}.page`;

    const relativePath = buildRelativePath(routesFile, pagePath);

    const routePath = strings.dasherize(options.routePath ? options.routePath : options.name);
    const componentImport = `${strings.classify(options.name)}Page`;
    const changes = addRouteToRoutesFile(source, routesFile, routePath, relativePath, componentImport);

    const recorder = host.beginUpdate(routesFile);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }

    host.commitUpdate(recorder);

    return host;
  };
}
