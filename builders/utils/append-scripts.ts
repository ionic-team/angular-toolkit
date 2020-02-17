import { load } from 'cheerio';

import { GlobalScriptsByBundleName } from '.';

export function augmentIndexHtml(indexString: string, scripts: GlobalScriptsByBundleName[]) {
  const $ = load(indexString);
  for (const script of scripts) {
    $('html').append(`<script src="${script.bundleName}.js"></script>`);
  }
  const final = $.html();
  return final;
}
