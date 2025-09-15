import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateLinkedPictures,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  buildBlock,
  toCamelCase,
} from './aem.js';

const LANGUAGES = new Set(['en', 'fr']);
let language;

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Returns language from pathname
 */
export function getLanguageFromPath(pathname, resetCache = false) {
  if (resetCache) language = undefined;
  if (language !== undefined) return language;

  const segs = pathname.split('/');
  if (segs.length > 1) {
    const l = segs[1];
    if (LANGUAGES.has(l)) language = l;
  }
  if (language === undefined) language = 'en'; // default
  return language;
}

export function getLanguage(curPath = window.location.pathname, resetCache = false) {
  return getLanguageFromPath(curPath, resetCache);
}

/**
 * Builds other-projects block if template is project/news article
 */
function buildOtherProjectsBlock(main) {
  if (!document.body.contains(main) || main.closest('header, footer')) return;

  const template = getMetadata('template');
  if (template === 'project-article' || template === 'news-article') {
    const section = document.createElement('div');
    section.append(buildBlock('featured-projects', { elems: [template] }));
    main.append(section);
  }
}

/**
 * Decorates the main element.
 */
export function decorateMain(main) {
  decorateButtons(main);
  decorateIcons(main);
  decorateLinkedPictures(main);
  buildOtherProjectsBlock(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads the template JS and CSS
 */
export async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = loadCSS(
      `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`,
    );

    const decorationComplete = (async () => {
      try {
        const mod = await import(
          `../templates/${templateName}/${templateName}.js`
        );
        if (mod.default) {
          await mod.default(doc);
        }
      } catch (error) {
        console.log(`failed to load module for ${templateName}`, error);
      }
    })();

    document.body.classList.add(`${templateName}-template`);

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * Loads placeholders (only news/project landing related)
 */
export async function loadAllPlaceholders() {
  if (window.placeholders && Object.keys(window.placeholders).length > 0) {
    return window.placeholders;
  }
  const currentLanguage = getLanguage();
  const sheetsToFetch = [
    currentLanguage,
    'category-news',
    'category-projects',
  ];

  const createDefaults = () => ({
    [currentLanguage]: {},
    'category-news': { en: [], fr: [] },
    'category-projects': { en: [], fr: [] },
  });

  try {
    const response = await fetch(
      `/placeholders.json?${sheetsToFetch.map((s) => `sheet=${s}`).join('&')}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    window.placeholders = createDefaults();

    sheetsToFetch.forEach((sheetName) => {
      const data = json[sheetName]?.data;
      if (!data) return;
      if (sheetName === 'category-news' || sheetName === 'category-projects') {
        window.placeholders[sheetName] = data.reduce(
          (acc, item) => {
            if (item.en) acc.en.push(item.en);
            if (item.fr) acc.fr.push(item.fr);
            return acc;
          },
          { en: [], fr: [] },
        );
      } else {
        window.placeholders[sheetName] = data.reduce((acc, item) => {
          if (item.Key) acc[toCamelCase(item.Key)] = item.Text;
          return acc;
        }, {});
      }
    });

    Object.assign(window.placeholders, window.placeholders[currentLanguage]);

    return window.placeholders;
  } catch (error) {
    console.error('Error loading placeholders:', error);
    window.placeholders = createDefaults();
    return window.placeholders;
  }
}

/**
 * Loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  document.documentElement.lang = getLanguage();

  // Load placeholders early
  await loadAllPlaceholders();

  const templateName = getMetadata('template');
  decorateTemplateAndTheme();

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    if (templateName) {
      await loadTemplate(doc, templateName);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
