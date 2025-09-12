import { div } from './dom-helpers.js';

export function getPathSegments() {
  return window.location.pathname.split('/')
    .filter((segment) => segment);
}

export function applyFadeUpAnimation(targetElement, parentContainer) {
  const isBanner = targetElement.classList.contains('horizontal-banner');

  // Create a wrapper div for the fade-up effect
  const targetWrapper = div({ class: 'image-fade-wrapper' });
  targetWrapper.style.opacity = '0';
  targetWrapper.style.transform = 'translateY(100px)';
  targetWrapper.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
  if (isBanner) {
    targetWrapper.classList.add('horizontal-banner');
  }
  targetWrapper.append(targetElement);
  parentContainer.append(targetWrapper);

  // Track scroll direction to prevent flickering
  let lastScrollY = window.scrollY;

  // Trigger fade-up animation when element comes into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;

      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      } else if (!scrollingDown) {
        // Only reset animation when scrolling up and element goes out of view
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(100px)';
      }

      lastScrollY = currentScrollY;
    });
  }, { threshold: 0.1 });

  observer.observe(targetWrapper);
}

// Apply fade-up animation to split-fade sections on fondations site
function applyFadeUpAnimationSplitFade() {
  const splitFadeSections = document.querySelectorAll('.section.fade-up');
  splitFadeSections.forEach((section) => {
    const imageElement = section.querySelector('picture');
    const parentContainer = section.querySelector('p:last-of-type');

    // Only apply animation if both elements exist within this section
    if (imageElement && parentContainer) {
      applyFadeUpAnimation(imageElement, parentContainer);
    }
  });
}

// Wait for DOM to be ready and then try with a small delay
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(applyFadeUpAnimationSplitFade, 50);
  });
} else {
  setTimeout(applyFadeUpAnimationSplitFade, 50);
}

export function decorateListingCards(doc) {
  const contentDivs = doc.querySelectorAll('.section.float-right .default-content-wrapper');
  contentDivs.forEach((contentDiv) => {
    const containerCol = div({ class: 'container-col' });
    const clearDiv = div({ class: 'clear' });
    const clearDivInner = div({ class: 'clear' });
    const headingWrapper = div({ class: 'heading-wrapper' });
    const contentWrapper = div({ class: 'content-wrapper' });
    const children = Array.from(contentDiv.children);
    children.forEach((child) => {
      if (child.tagName === 'H1' || child.tagName === 'H2') {
        headingWrapper.appendChild(child);
      } else {
        contentWrapper.appendChild(child);
      }
    });
    contentWrapper.appendChild(clearDivInner);
    containerCol.append(headingWrapper, contentWrapper, clearDiv);
    contentDiv.append(containerCol);
  });
}

export function setInputWidthToText(inputEl) {
  const textToMeasure = inputEl.value || inputEl.placeholder;
  const spanForWidth = document.createElement('span');
  const style = getComputedStyle(inputEl);
  spanForWidth.style.font = style.font;
  spanForWidth.style.whiteSpace = 'pre';
  spanForWidth.style.position = 'absolute';
  spanForWidth.style.visibility = 'hidden';
  spanForWidth.textContent = textToMeasure;
  document.body.appendChild(spanForWidth);
  const width = spanForWidth.offsetWidth;
  spanForWidth.remove();
  inputEl.style.width = `${width}px`;
}
