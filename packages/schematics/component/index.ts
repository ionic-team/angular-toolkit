import { strings } from '@angular-devkit/core';
import type { Rule, Tree } from '@angular-devkit/schematics';
import {
  SchematicsException,
  apply,
  branchAndMerge,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  template,
  url,
} from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { validateHtmlSelector } from '@schematics/angular/utility/validation';
import { buildDefaultPath, getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';

import { buildSelector } from '../util';
import {
  addDeclarationToModule,
  addEntryComponentToModule,
  addExportToModule,
  addSymbolToNgModuleMetadata,
} from '../util/ast-util';
import { InsertChange } from '../util/change';

import type { Schema as ComponentOptions } from './schema';

function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');

  return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

function addImportToNgModule(options: ComponentOptions): Rule {
  return (host: Tree) => {
    if (!options.module) {
      return host;
    }
    if (!options.createModule && options.module) {
      addImportToDeclarations(host, options);
    }
    if (options.createModule && options.module) {
      addImportToImports(host, options);
    }
    return host;
  };
}

function addImportToDeclarations(host: Tree, options: ComponentOptions): void {
  if (options.module) {
    const modulePath = options.module;
    let source = readIntoSourceFile(host, modulePath);

    const componentPath =
      `/${options.path}/` +
      (options.flat ? '' : strings.dasherize(options.name) + '/') +
      strings.dasherize(options.name) +
      '.component';
    const relativePath = buildRelativePath(modulePath, componentPath);
    const classifiedName = strings.classify(`${options.name}Component`);
    const declarationChanges = addDeclarationToModule(source, modulePath, classifiedName, relativePath);

    const declarationRecorder = host.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(declarationRecorder);

    if (options.export) {
      // Need to refresh the AST because we overwrote the file in the host.
      source = readIntoSourceFile(host, modulePath);

      const exportRecorder = host.beginUpdate(modulePath);
      const exportChanges = addExportToModule(
        source,
        modulePath,
        strings.classify(`${options.name}Component`),
        relativePath
      );

      for (const change of exportChanges) {
        if (change instanceof InsertChange) {
          exportRecorder.insertLeft(change.pos, change.toAdd);
        }
      }
      host.commitUpdate(exportRecorder);
    }

    if (options.entryComponent) {
      // Need to refresh the AST because we overwrote the file in the host.
      source = readIntoSourceFile(host, modulePath);

      const entryComponentRecorder = host.beginUpdate(modulePath);
      const entryComponentChanges = addEntryComponentToModule(
        source,
        modulePath,
        strings.classify(`${options.name}Component`),
        relativePath
      );

      for (const change of entryComponentChanges) {
        if (change instanceof InsertChange) {
          entryComponentRecorder.insertLeft(change.pos, change.toAdd);
        }
      }
      host.commitUpdate(entryComponentRecorder);
    }
  }
}

function addImportToImports(host: Tree, options: ComponentOptions): void {
  if (options.module) {
    const modulePath = options.module;
    const moduleSource = readIntoSourceFile(host, modulePath);

    const componentModulePath =
      `/${options.path}/` +
      (options.flat ? '' : strings.dasherize(options.name) + '/') +
      strings.dasherize(options.name) +
      '.module';

    const relativePath = buildRelativePath(modulePath, componentModulePath);
    const classifiedName = strings.classify(`${options.name}ComponentModule`);
    const importChanges = addSymbolToNgModuleMetadata(
      moduleSource,
      modulePath,
      'imports',
      classifiedName,
      relativePath
    );

    const importRecorder = host.beginUpdate(modulePath);
    for (const change of importChanges) {
      if (change instanceof InsertChange) {
        importRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(importRecorder);
  }
}

export default function (options: ComponentOptions): Rule {
  return async (host: Tree) => {
    if (!options.project) {
      throw new SchematicsException('Option (project) is required.');
    }

    const workspace = await getWorkspace(host);
    const project = workspace.projects.get(options.project);
    if (project && options.path === undefined) {
      options.path = buildDefaultPath(project);
    }

    const parsedPath = parseName(options.path as string, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;
    options.selector = options.selector ? options.selector : buildSelector(options, project?.prefix ?? 'app');

    validateHtmlSelector(options.selector);

    const templateSource = apply(url('./files'), [
      options.spec ? noop() : filter((p) => !p.endsWith('.spec.ts')),
      options.createModule ? noop() : filter((p) => !p.endsWith('.module.ts')),
      template({
        ...strings,
        'if-flat': (s: string) => (options.flat ? '' : s),
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([branchAndMerge(chain([addImportToNgModule(options), mergeWith(templateSource)]))]);
  };
}
