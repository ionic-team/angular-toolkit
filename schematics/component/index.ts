import { strings } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, noop, template, url } from '@angular-devkit/schematics';
import { addSymbolToNgModuleMetadata } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath, getProject } from '@schematics/angular/utility/project';
import { validateHtmlSelector, validateName } from '@schematics/angular/utility/validation';
import * as ts from 'typescript';

import { buildSelector } from '../util';

import { Schema as ComponentOptions } from './schema';

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

    const modulePath = options.module;
    const moduleSource = readIntoSourceFile(host, modulePath);

    const componentModulePath = `/${options.path}/`
                          + (options.flat ? '' : strings.dasherize(options.name) + '/')
                          + strings.dasherize(options.name)
                          + '.module';

    const relativePath = buildRelativePath(modulePath, componentModulePath);
    const classifiedName = strings.classify(`${options.name}ComponentModule`);
    const importChanges = addSymbolToNgModuleMetadata(moduleSource, modulePath, 'imports', classifiedName, relativePath);

    const importRecorder = host.beginUpdate(modulePath);
    for (const change of importChanges) {
      if (change instanceof InsertChange) {
        importRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(importRecorder);
    return host;
  };
}

export default function(options: ComponentOptions): Rule {
  return (host, context) => {
    if (!options.project) {
      throw new SchematicsException('Option (project) is required.');
    }

    const project = getProject(host, options.project);

    if (options.path === undefined) {
      options.path = buildDefaultPath(project);
    }

    const parsedPath = parseName(options.path, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;
    options.selector = options.selector ? options.selector : buildSelector(options, project.prefix);

    validateName(options.name);
    validateHtmlSelector(options.selector);

    const templateSource = apply(url('./files'), [
      options.spec ? noop() : filter(p => !p.endsWith('.spec.ts')),
      template({
        ...strings,
        'if-flat': (s: string) => options.flat ? '' : s,
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([
      branchAndMerge(chain([
        addImportToNgModule(options),
        mergeWith(templateSource),
      ])),
    ])(host, context);
  };
}
