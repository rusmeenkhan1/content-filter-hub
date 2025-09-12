import {
  div, h2, input, span, a, img,
} from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import {
  fetchPlaceholders,
} from '../../scripts/aem.js';
import { getLanguage } from '../../scripts/scripts.js';
import { applyFadeUpAnimation, setInputWidthToText } from '../../scripts/utils.js';

async function getProjectsdata() {
  const { hostname } = window.location;
  let rawProjects = [];

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
    const projectsPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-les-arbres-projects' : 'fondation-pour-les-arbres-nos-projets'}/projects-index.json`;
    const result = await safeFetch(projectsPath);
    if (result) {
      if (getLanguage() === 'fr') {
        rawProjects = result.filter((project) => project.path.includes('/fr/fondation-pour-les-arbres-nos-projets/'));
      } else {
        rawProjects = result.filter((project) => project.path.includes('/en/fondation-pour-les-arbres-projects/'));
      }
    }
  } else if (hostname.includes('biencommun')) {
    const projectsPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-le-bien-commun-projects' : 'fondation-pour-le-bien-commun-nos-projets'}/projects-index.json`;
    const result = await safeFetch(projectsPath);
    if (result) {
      if (getLanguage() === 'fr') {
        rawProjects = result.filter((project) => project.path.includes('/fr/fondation-pour-le-bien-commun-nos-projets/'));
      } else {
        rawProjects = result.filter((project) => project.path.includes('/en/fondation-pour-le-bien-commun-projects/'));
      }
    }
  } else {
    // For localhost or other domains, try arbres first, fallback to biencommun
    const arbresPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-les-arbres-projects' : 'fondation-pour-les-arbres-nos-projets'}/projects-index.json`;
    const bienCommunPath = `/${getLanguage()}/${getLanguage() === 'en' ? 'fondation-pour-le-bien-commun-projects' : 'fondation-pour-le-bien-commun-nos-projets'}/projects-index.json`;

    let result = await safeFetch(arbresPath);

    // ffetch returns empty array for 404s instead of throwing error
    // So we check if result is null OR an empty array, then try fallback
    if (!result || (Array.isArray(result) && result.length === 0)) {
      result = await safeFetch(bienCommunPath);
    }

    if (result && Array.isArray(result) && result.length > 0) {
      rawProjects = result;
    } else {
      rawProjects = []; // Ensure it's an empty array
    }
  }
  return rawProjects;
}

function showProjectCards(getprojects, doc) {
  getprojects.forEach((projects) => {
    const url = projects.path;
    const $projectsItem = a(
      { class: 'project-item', href: url },
      div(
        { class: 'projects-image-wrapper' },
        img(
          { class: 'projects-image', src: projects.image, alt: projects.title },
        ),
      ),
      div(
        { class: 'projects-partner' },
        span(projects.partner),
      ),
      div(
        { class: 'projects-location' },
        span(projects.location),
      ),
      div(
        { class: 'projects-duration' },
        span(projects.duration),
      ),
      h2({ class: 'projects-title' }, projects.title),
      span({ class: 'projects-date' }, projects.date),
      span({ class: 'projects-category' }, projects.category),
    );
    doc.querySelector('.projects-listing').append($projectsItem);
  });
  const projectItems = doc.querySelectorAll('.project-item');
  projectItems.forEach((project) => {
    applyFadeUpAnimation(project, project.parentNode);
  });
}

export default async function decorate(doc) {
  const $main = doc.querySelector('main');
  const $section = doc.querySelector('main .section:last-of-type');
  const $filterContainer = div({ class: 'filter-container' });
  let { placeholders } = window;
  if (!placeholders) {
    placeholders = await fetchPlaceholders(`${getLanguage()}`);
  }
  const { projectsLandingCategoryFilter } = placeholders;
  const { projectsLandingLocationFilter } = placeholders;
  const { projectsLandingViewFilter } = placeholders;
  const { projectsLandingSearchFilter } = placeholders;

  const $projectsListingRight = div({ class: 'projects-listing-container-right' });
  const $mapLink = a({ class: 'map-link-btn', href: '/en/fondation-pour-les-arbres-projects-map', id: 'map-link' }, 'See Map');

  $projectsListingRight.append($mapLink);

  const $projectsListingLeft = div(
    { class: 'projects-listing-container-left' },
    div(
      { class: 'category-section' },
      input(
        {
          class: 'category-input', id: 'filtercategories-selectized', placeholder: projectsLandingCategoryFilter, type: 'text', autofill: 'no',
        },
      ),
      div(
        { class: 'category-dropdown' },
      ),
    ),
    span({ class: 'filter-separator' }, ' | '),
    div(
      { class: 'location-section' },
      input(
        {
          class: 'location-input', id: 'filterlocations-selectized', placeholder: projectsLandingLocationFilter, type: 'text', autofill: 'no',
        },
      ),
      div(
        { class: 'location-dropdown' },
      ),
    ),
    span({ class: 'filter-separator' }, ' | '),
    a({ class: 'view-all', href: '#', id: 'view-all' }, projectsLandingViewFilter),
    span({ class: 'filter-separator' }, ' | '),
    div(
      { class: 'search-section' },
      input(
        {
          class: 'search-input', id: 'filtersearch', placeholder: projectsLandingSearchFilter, type: 'text', minlength: '2', size: '10',
        },
      ),
      a({ class: 'btn-search-clear', href: '#' }),
    ),
  );

  $filterContainer.append($projectsListingLeft, $projectsListingRight);
  const $projectsListing = div(
    { class: 'projects-listing-container' },
    div(
      { class: 'projects-listing' },
    ),
  );
  $section.append($filterContainer, $projectsListing);
  const getProjects = await getProjectsdata();
  const allCategories = getProjects
    .flatMap((item) => (item.category || '').split('|'))
    .map((cat) => cat.trim())
    .filter((cat) => cat);
  const uniqueCategories = [...new Set(allCategories)].sort();
  const categoryList = doc.createElement('ul');
  uniqueCategories.forEach((category) => {
    const categoryItem = doc.createElement('li');
    categoryItem.textContent = category;
    categoryList.appendChild(categoryItem);
  });

  const allLocations = getProjects
    .flatMap((item) => (item.location || '').split('|'))
    .map((cat) => cat.trim())
    .filter((cat) => cat);
  const uniqueLocations = [...new Set(allLocations)].sort();
  const locationList = doc.createElement('ul');
  uniqueLocations.forEach((category) => {
    const locationItem = doc.createElement('li');
    locationItem.textContent = category;
    locationList.appendChild(locationItem);
  });

  $main.append($section);

  const sortedProjects = getProjects.sort((dateA, dateB) => {
    const [startA, endA] = dateA.duration.replace(/\s*→\s*/, '→').split('→').map((y) => parseInt(y.trim(), 10));
    const [startB, endB] = dateB.duration.replace(/\s*→\s*/, '→').split('→').map((y) => parseInt(y.trim(), 10));
    if (endA !== endB) {
      return endB - endA; // Descending end year
    }
    return startB - startA; // Ascending start year
  });
  showProjectCards(sortedProjects, doc);
  const categorysection = doc.querySelector('.category-dropdown');
  const locationsection = doc.querySelector('.location-dropdown');
  locationsection.appendChild(locationList);
  categorysection.appendChild(categoryList);
  const $categoryInput = doc.querySelector('.category-input');
  $categoryInput.addEventListener('click', () => {
    locationsection.style.display = 'none';
    categorysection.style.display = categorysection.style.display === 'block' ? 'none' : 'block';
  });

  const $locationInput = doc.querySelector('.location-input');
  $locationInput.addEventListener('click', () => {
    categorysection.style.display = 'none';
    locationsection.style.display = locationsection.style.display === 'block' ? 'none' : 'block';
  });

  const inputCat = doc.querySelector('.category-input');
  const inputLocation = doc.querySelector('.location-input');
  doc.addEventListener('click', (e) => {
    if (
      !categorysection.contains(e.target)
      && !locationsection.contains(e.target)
      && e.target !== $categoryInput
      && e.target !== $locationInput
    ) {
      categorysection.style.display = 'none';
      locationsection.style.display = 'none';
    }
  });

  const projectsListing = doc.querySelector('.projects-listing');
  const categoryItems = categorysection.querySelectorAll('li');
  const locationItems = locationsection.querySelectorAll('li');
  categoryItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const selectedCategory = event.target.textContent;
      $categoryInput.value = selectedCategory;
      setInputWidthToText(inputCat);
      categorysection.style.display = 'none';
      locationsection.style.display = 'none';
      const filteredprojects = getProjects
        .filter((project) => !$locationInput.value
        || (project.location && project.location.includes($locationInput.value)))
        .filter((project) => project.category && project.category.includes(selectedCategory));
      projectsListing.innerHTML = '';
      showProjectCards(filteredprojects, doc);
    });
  });

  locationItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const selectedLocation = event.target.textContent;
      $locationInput.value = selectedLocation;
      setInputWidthToText(inputLocation);
      locationsection.style.display = 'none';
      categorysection.style.display = 'none';

      const filteredprojects = getProjects
        .filter((project) => !$categoryInput.value
        || (project.category && project.category.includes($categoryInput.value)))
        .filter((project) => project.location && project.location.includes(selectedLocation));

      projectsListing.innerHTML = '';
      showProjectCards(filteredprojects, doc);
    });
  });

  const searchInput = document.getElementById('filtersearch');
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredProject = searchTerm.length < 2
          ? getProjects
          : getProjects.filter((projects) => {
            const title = projects.title.toLowerCase();
            const category = projects.category.toLowerCase();
            const location = projects.location.toLowerCase();
            const partner = projects.partner.toLowerCase();
            return title.includes(searchTerm) || category.includes(searchTerm)
            || location.includes(searchTerm) || partner.includes(searchTerm);
          });
        projectsListing.innerHTML = '';
        showProjectCards(filteredProject, document);
      }, 300);
    });
  }

  const viewAllButton = doc.getElementById('view-all');
  viewAllButton.addEventListener('click', (event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      setInputWidthToText(inputCat);
      setInputWidthToText(inputLocation);
      setInputWidthToText(searchInput);
    });
    $categoryInput.value = '';
    $locationInput.value = '';
    searchInput.value = '';
    projectsListing.innerHTML = '';
    showProjectCards(getProjects, doc);
  });

  const clearSearchBtn = doc.querySelector('.btn-search-clear');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', (event) => {
      event.preventDefault();
      searchInput.value = '';
      projectsListing.innerHTML = '';
      showProjectCards(getProjects, doc);
    });
  }

  requestAnimationFrame(() => {
    setInputWidthToText(inputCat);
    setInputWidthToText(inputLocation);
    setInputWidthToText(searchInput);
  });
}
