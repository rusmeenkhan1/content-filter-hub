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
import { decorateListingCards } from './utils.js';

const LANGUAGES = new Set(['en', 'fr']);
let language;

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * @param {Element} main
 */
function buildOtherProjectsBlock(main) {
  // Only build the block on the main page content, not on fragments
  if (!document.body.contains(main) || main.closest('header, footer')) {
    return;
  }

  const template = getMetadata('template');
  if (template === 'project-article' || template === 'news-article') {
    const section = document.createElement('div');
    section.append(buildBlock('featured-projects', { elems: [template] }));
    main.append(section);
  }
}

export function getLanguageFromPath(pathname, resetCache = false) {
  if (resetCache) {
    language = undefined;
  }

  if (language !== undefined) return language;

  const segs = pathname.split('/');
  if (segs.length > 1) {
    const l = segs[1];
    if (LANGUAGES.has(l)) {
      language = l;
    }
  }

  if (language === undefined) {
    language = 'en'; // default to English
  }

  return language;
}

export function getLanguage(curPath = window.location.pathname, resetCache = false) {
  return getLanguageFromPath(curPath, resetCache);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateLinkedPictures(main);
  buildAutoBlocks(main);
  buildOtherProjectsBlock(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateListingCards(main);
}

/**
 * Decorates the template.
 */
export async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(
        `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`,
      )
        .then(resolve)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `failed to load css module for ${templateName}`,
            err.target.href,
          );
          resolve();
        });
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(
            `../templates/${templateName}/${templateName}.js`
          );
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });

    document.body.classList.add(`${templateName}-template`);

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

export async function loadAllPlaceholders() {
  // Early return if already loaded
  if (window.placeholders && Object.keys(window.placeholders).length > 1) {
    return window.placeholders;
  }

  const currentLanguage = getLanguage();
  const sheetsToFetch = [
    currentLanguage,
    currentLanguage === 'en' ? 'fr' : 'en',
    'category-news',
    'category-projects',
    'language-switcher',
    currentLanguage === 'fr' ? 'mapmarkers-fr' : 'mapmarkers',
  ];

  // Create default structure
  const createDefaults = () => ({
    [currentLanguage]: {},
    [currentLanguage === 'en' ? 'fr' : 'en']: {},
    'category-news': { en: [], fr: [] },
    'category-projects': { en: [], fr: [] },
    'language-switcher': [],
  });

  // Sheet processors for different data types
  const processors = {
    category: (data) => data.reduce((acc, item) => {
      if (item.en) acc.en.push(item.en);
      if (item.fr) acc.fr.push(item.fr);
      return acc;
    }, { en: [], fr: [] }),

    language: (data) => data.reduce((acc, item) => {
      if (item.Key) acc[toCamelCase(item.Key)] = item.Text;
      return acc;
    }, {}),

    raw: (data) => data,
  };

  try {
    const response = await fetch(`/placeholders.json?${sheetsToFetch.map((s) => `sheet=${s}`).join('&')}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    window.placeholders = createDefaults();

    // Process each sheet with appropriate processor
    sheetsToFetch.forEach((sheetName) => {
      const data = json[sheetName]?.data;
      if (!data) return;

      if (sheetName === 'category-news' || sheetName === 'category-projects') {
        window.placeholders[sheetName] = processors.category(data);
      } else if (sheetName === 'language-switcher' || sheetName === 'mapmarkers' || sheetName === 'mapmarkers-fr') {
        window.placeholders[sheetName] = processors.raw(data);
      } else {
        window.placeholders[sheetName] = processors.language(data);
      }
    });

    // Merge current language to root for backward compatibility
    Object.assign(window.placeholders, window.placeholders[currentLanguage]);

    return window.placeholders;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading placeholders:', error);
    window.placeholders = createDefaults();
    return window.placeholders;
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getLanguage();

  // Load all placeholders early in the application lifecycle
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
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
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
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
