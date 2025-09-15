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
