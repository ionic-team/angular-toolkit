import { Path, join, normalize, strings } from '@angular-devkit/core';
import { DirEntry, Rule, SchematicsException, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, noop, template, url } from '@angular-devkit/schematics';
import { ModuleOptions, buildRelativePath } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector, validateName } from '@schematics/angular/utility/validation';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { buildSelector } from '../util';
import { findNodes } from '../util/ast-util';
import { Change, InsertChange } from '../util/change';

import { Schema as PageOptions } from './schema';

function findRoutingModuleFromOptions(
  host: Tree,
  options: ModuleOptions
): Path | undefined {
  if (options.hasOwnProperty('skipImport') && options.skipImport) {
    return undefined;
  }

  if (!options.module) {
    const pathToCheck =
      (options.path || '') +
      (options.flat ? '' : '/' + strings.dasherize(options.name));

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

function findRoutingModule(host: Tree, generateDir: string): Path {
  let dir: DirEntry | null = host.getDir('/' + generateDir);

  const routingModuleRe = /-routing\.module\.ts/;

  while (dir) {
    const matches = dir.subfiles.filter(p => routingModuleRe.test(p));

    if (matches.length === 1) {
      return join(dir.path, matches[0]);
    } else if (matches.length > 1) {
      throw new Error(
        'More than one module matches. Use skip-import option to skip importing ' +
          'the component into the closest module.'
      );
    }

    dir = dir.parent;
  }

  throw new Error(
    'Could not find an NgModule. Use the skip-import ' +
      'option to skip importing in NgModule.'
  );
}

function addRouteToNgModule(options: PageOptions): Rule {
  const { module } = options;

  if (!module) {
    throw new SchematicsException('module option is required.');
  }

  return host => {
    const text = host.read(module);

    if (!text) {
      throw new SchematicsException(`File ${module} does not exist.`);
    }

    const sourceText = text.toString('utf8');
    const source = ts.createSourceFile(
      module,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const pagePath =
      `/${options.path}/` +
      (options.flat ? '' : `${strings.dasherize(options.name)}/`) +
      `${strings.dasherize(options.name)}.module`;

    const relativePath = buildRelativePath(module, pagePath);

    const routePath = strings.dasherize(
      options.routePath ? options.routePath : options.name
    );
    const ngModuleName = `${strings.classify(options.name)}PageModule`;
    const changes = addRouteToRoutesArray(
      source,
      module,
      routePath,
      relativePath,
      ngModuleName
    );
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

function addRouteToRoutesArray(
  source: ts.SourceFile,
  ngModulePath: string,
  routePath: string,
  routeLoadChildren: string,
  ngModuleName: string
): Change[] {
  const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);

  for (const keyword of keywords) {
    if (ts.isVariableStatement(keyword)) {
      const [declaration] = keyword.declarationList.declarations;

      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        declaration.name.getText() === 'routes'
      ) {
        const node = declaration.initializer.getChildAt(1);
        const lastRouteNode = node.getLastToken();

        if (!lastRouteNode) {
          return [];
        }

        const changes: Change[] = [];
        let trailingCommaFound = false;

        if (lastRouteNode.kind === ts.SyntaxKind.CommaToken) {
          trailingCommaFound = true;
        } else {
          changes.push(
            new InsertChange(ngModulePath, lastRouteNode.getEnd(), ',')
          );
        }

        changes.push(
          new InsertChange(
            ngModulePath,
            lastRouteNode.getEnd() + 1,
            `  {\n    path: '${routePath}',\n    loadChildren: () => import('${routeLoadChildren}').then( m => m.${ngModuleName})\n  }${
              trailingCommaFound ? ',' : ''
            }\n`
          )
        );

        return changes;
      }
    }
  }

  return [];
}

export default function(options: PageOptions): Rule {
  return async (host: Tree) => {
    if (!options.project) {
      throw new SchematicsException('Option (project) is required.');
    }

    const workspace = await getWorkspace(host);
    const project = workspace.projects.get(options.project);
    if (project && options.path === undefined) {
      options.path = buildDefaultPath(project);
    }

    options.module = findRoutingModuleFromOptions(host, options);

    const parsedPath = parseName(options.path as string, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;
    options.selector = options.selector ? options.selector : buildSelector(options, project?.prefix ?? 'app');

    validateName(options.name);
    validateHtmlSelector(options.selector);

    const templateSource = apply(url('./files'), [
      options.spec ? noop() : filter(p => !p.endsWith('.spec.ts')),
      template({
        ...strings,
        'if-flat': (s: string) => (options.flat ? '' : s),
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([
      branchAndMerge(
        chain([addRouteToNgModule(options), mergeWith(templateSource)])
      ),
    ]);
  };
}
