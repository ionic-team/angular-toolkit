import { load } from 'cheerio';

import type { GlobalScriptsByBundleName } from '.';

export function augmentIndexHtml(
  indexString: string,
  scripts: GlobalScriptsByBundleName[],
): string {
  const $ = load(indexString);
  for (const script of scripts) {
    $('html').append(`<script src="${script.bundleName}.js"></script>`);
  }
  const final = $.html();
  return final;
}
