import {
  div, input, span, a, h2, img, p,
} from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import {
  fetchPlaceholders,
} from '../../scripts/aem.js';
import { getLanguage } from '../../scripts/scripts.js';
import { applyFadeUpAnimation, setInputWidthToText } from '../../scripts/utils.js';

async function getNewsdata() {
  const { hostname } = window.location;
  let rawNews = [];

  // Helper function to safely fetch with ffetch
  const safeFetch = async (path) => {
    try {
      const result = await ffetch(path)
        .chunks(1000)
        .all();
      return result;
    } catch (error) {
      return null;
    }
  };

  // Determine the path based on domain
  if (hostname.includes('arbres')) {
    const newsPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-les-arbres-news' : 'fondation-pour-les-arbres-actualites'}/news-index.json`;
    const result = await safeFetch(newsPath);
    if (result) {
      if (getLanguage() === 'fr') {
        rawNews = result.filter((news) => news.path.includes('/fr/fondation-pour-les-arbres-actualites/'));
      } else {
        rawNews = result.filter((news) => news.path.includes('/en/fondation-pour-les-arbres-news/'));
      }
    }
  } else if (hostname.includes('biencommun')) {
    const newsPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-le-bien-commun-news' : 'fondation-pour-le-bien-commun-actualites'}/news-index.json`;
    const result = await safeFetch(newsPath);
    if (result) {
      if (getLanguage() === 'fr') {
        rawNews = result.filter((news) => news.path.includes('/fr/fondation-pour-le-bien-commun-actualites/'));
      } else {
        rawNews = result.filter((news) => news.path.includes('/en/fondation-pour-le-bien-commun-news/'));
      }
    }
  } else {
    // For localhost or other domains, try arbres first, fallback to biencommun
    const arbresPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-les-arbres-news' : 'fondation-pour-les-arbres-actualites'}/news-index.json`;
    const bienCommunPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-le-bien-commun-news' : 'fondation-pour-le-bien-commun-actualites'}/news-index.json`;

    let result = await safeFetch(arbresPath);

    // ffetch returns empty array for 404s instead of throwing error
    // So we check if result is null OR an empty array, then try fallback
    if (!result || (Array.isArray(result) && result.length === 0)) {
      result = await safeFetch(bienCommunPath);
    }

    if (result && Array.isArray(result) && result.length > 0) {
      rawNews = result;
    } else {
      rawNews = []; // Ensure it's an empty array
    }
  }
  return rawNews;
}

function showNewsArticles(getNews, doc) {
  getNews.forEach((news) => {
    const url = news.path;
    // Create description with smart sentence limiting
    const newsDescription = p();
    if (news.description) {
      const sentences = news.description
        .split(/\.\s*(?=[A-Z]|$)/)
        .filter((s) => s.trim().length > 0)
        .map((s) => s.trim() + (s.trim().endsWith('.') ? '' : '.'));
      let descriptionText = sentences.slice(0, 2).join(' ').trim();
      if (descriptionText.length > 500 && sentences.length > 1) {
        descriptionText = sentences[0].trim();
      }
      newsDescription.textContent = descriptionText;
    } else {
      newsDescription.textContent = '';
    }
    const $newsItem = a(
      { class: 'news-item', href: url },
      div(
        { class: 'news-image-wrapper' },
        img(
          { class: 'news-image', src: news.image, alt: news.title },
        ),
      ),
      div(
        { class: 'news-content-wrapper' },
        span({ class: 'news-category' }, news.category),
        span({ class: 'news-date' }, news.date),
        h2({ class: 'news-title' }, news.title),
        div({ class: 'news-description' }, newsDescription),
      ),
      div({ class: 'clear' }),
    );

    if (news['article-color']) {
      $newsItem.classList.add(news['article-color']);
    }
    const { layout } = news;
    if (layout) {
      $newsItem.classList.add(layout);
    }
    doc.querySelector('.news-listing').append($newsItem);
  });
  const newsItems = doc.querySelectorAll('.news-item');
  newsItems.forEach((news) => {
    applyFadeUpAnimation(news, news.parentNode);
  });
}

function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('.');
  return new Date(`${year}-${month}-${day}`);
}

export default async function decorate(doc) {
  const $main = doc.querySelector('main');
  const $section = doc.querySelector('main .section:last-of-type');
  const $filterContainer = div({ class: 'filter-container' });
  const $newsListingRight = div({ class: 'news-listing-container-right' });
  const $filterTop = a({ class: 'filter-top-btn' });
  const $fitlerBottom = a({ class: 'filter-bottom-btn' });
  $newsListingRight.append($filterTop, $fitlerBottom);
  const placeholders = await fetchPlaceholders(`${getLanguage()}`);
  const { newsLandingCategoryFilter } = placeholders;
  const { newsLandingSearchFilter } = placeholders;
  const { newsLandingViewFilter } = placeholders;
  const $newsListingLeft = div(
    { class: 'news-listing-container-left' },
    div(
      { class: 'category-section' },
      input(
        {
          class: 'category-input', id: 'filtercategories-selectized', placeholder: newsLandingCategoryFilter, type: 'text', autofill: 'no',
        },
      ),
      div(
        { class: 'category-dropdown' },
      ),
    ),
    span({ class: 'filter-separator' }, ' | '),
    a({ class: 'view-all', href: '#', id: 'view-all' }, newsLandingViewFilter),
    span({ class: 'filter-separator' }, ' | '),
    div(
      { class: 'search-section' },
      input(
        {
          class: 'search-input', id: 'filtersearch', placeholder: newsLandingSearchFilter, type: 'text', minlength: '2', size: '10',
        },
      ),
    ),
    a({ class: 'btn-search-clear', href: '#' }),
  );
  $newsListingRight.append($filterTop, $fitlerBottom);
  $filterContainer.append($newsListingLeft, $newsListingRight);
  const $newsListing = div(
    { class: 'news-listing-container' },
    div(
      { class: 'news-listing' },
    ),
  );
  $section.append($filterContainer, $newsListing);
  const getNews = await getNewsdata();
  const allCategories = getNews
    .flatMap((item) => (item.category || '').split(','))
    .map((cat) => cat.trim())
    .filter((cat) => cat);
  const uniqueCategories = [...new Set(allCategories)].sort();
  const categoryList = document.createElement('ul');
  uniqueCategories.forEach((category) => {
    const categoryItem = document.createElement('li');
    categoryItem.textContent = category;
    categoryList.appendChild(categoryItem);
  });

  $main.append($section);
  const categorysection = doc.querySelector('.category-dropdown');
  categorysection.appendChild(categoryList);
  const $categoryInput = doc.querySelector('.category-input');
  $categoryInput.addEventListener('click', () => {
    categorysection.style.display = categorysection.style.display === 'block' ? 'none' : 'block';
  });

  const inputCat = doc.querySelector('.category-input');
  const newsListing = document.querySelector('.news-listing');
  const sortedNews = getNews
    .sort((date1, date2) => parseDate(date2.date) - parseDate(date1.date));
  showNewsArticles(sortedNews, doc);
  const categoryItems = categorysection.querySelectorAll('li');
  categoryItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const selectedCategory = event.target.textContent;
      $categoryInput.value = selectedCategory;
      requestAnimationFrame(() => {
        setInputWidthToText(inputCat);
      });
      categorysection.style.display = 'none';
      const filteredNews = getNews.filter((news) => news.category
      && news.category.includes(selectedCategory));
      newsListing.innerHTML = '';
      showNewsArticles(filteredNews, doc);
    });
  });

  document.addEventListener('click', (event) => {
    if (
      !categorysection.contains(event.target)
      && event.target !== $categoryInput
    ) {
      categorysection.style.display = 'none';
    }
  });

  const viewAllButton = doc.getElementById('view-all');
  viewAllButton.addEventListener('click', (event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      setInputWidthToText(inputCat);
    });
    $categoryInput.value = '';
    newsListing.innerHTML = '';
    showNewsArticles(sortedNews, doc);
  });

  const searchInput = document.getElementById('filtersearch');
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredNews = searchTerm.length < 2
          ? sortedNews
          : sortedNews.filter((news) => {
            const title = news.title.toLowerCase();
            return title.includes(searchTerm);
          });
        newsListing.innerHTML = '';
        showNewsArticles(filteredNews, document);
      }, 300);
    });
  }

  const clearSearchBtn = doc.querySelector('.btn-search-clear');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', (event) => {
      event.preventDefault();
      searchInput.value = '';
      newsListing.innerHTML = '';
      showNewsArticles(getNews, doc);
    });
  }

  const sortByDate = doc.querySelector('.filter-top-btn');
  if (sortByDate) {
    sortByDate.addEventListener('click', (event) => {
      event.preventDefault();
      newsListing.innerHTML = '';
      showNewsArticles(sortedNews, doc);
    });
  }

  const reverseSortByDate = doc.querySelector('.filter-bottom-btn');
  if (reverseSortByDate) {
    reverseSortByDate.addEventListener('click', (event) => {
      event.preventDefault();
      const reverseSortedNews = sortedNews.slice()
        .sort((date1, date2) => parseDate(date1.date) - parseDate(date2.date));
      newsListing.innerHTML = '';
      showNewsArticles(reverseSortedNews, doc);
    });
  }

  requestAnimationFrame(() => {
    setInputWidthToText(inputCat);
    setInputWidthToText(searchInput);
  });
}
