import { getMetadata } from '../../scripts/aem.js';
import { applyFadeUpAnimation } from '../../scripts/utils.js';
import {
  div, h1, a, ul, li,
} from '../../scripts/dom-helpers.js';

export function enableAnimationOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible'); // remove class when out of view
      }
    });
  }, { threshold: 0.1 }); // Trigger when 10% visible

  const elements = document.querySelectorAll('.animate-on-scroll');
  elements.forEach((el) => observer.observe(el));
}

export default async function decorate(doc) {
  const sidebar = div({ class: 'news-article-sidebar' });
  const language = getMetadata('language');
  const author = getMetadata('author');
  const newsDiv = doc.querySelector('.news-article-template .details-sidebar');
  const viewMoreButton = doc.querySelector('.news-article-template .details-sidebar .default-content-wrapper .button-container');
  const buttonDiv = div({ class: 'button-wrapper' });
  buttonDiv.append(viewMoreButton);
  const rightAlignSidebar = doc.querySelector('.news-article-template .details-sidebar.right');
  if (!newsDiv.classList.contains('right')) {
    if (language === 'en') {
      sidebar.innerHTML = `      
        <div> Link(s) </div>
        <div class="photos"> Photos </div>
        <div class="author">Written by</div>
          ${author}
        <div> Follow us </div>
      `;
    } else if (language === 'fr') {
      sidebar.innerHTML = `      
        <div> Lien(s) </div>
        <div class="photos"> Photos </div>
        <div class="author">Rédaction</div>
          ${author}
        <div> Nous suivre </div>
      `;
    }
    const links = getMetadata('links');
    const photos = getMetadata('photos');
    const link = a({ href: links }, links);
    const words = photos.trim().split(',');
    const photoList = ul();
    words.forEach((word) => {
      const listItem = li(word);
      photoList.appendChild(listItem);
    });
    const linkedin = a({ href: 'https://www.linkedin.com/company/audemars-piguet-foundations/', target: '_blank' }, '↳ LinkedIn');
    sidebar.insertBefore(link, sidebar.querySelector('.photos'));
    sidebar.insertBefore(photoList, sidebar.querySelector('.author'));
    sidebar.appendChild(linkedin);
    const articleContent = newsDiv.querySelector('.default-content-wrapper');
    const heading = getMetadata('og:title');
    let title;
    if (heading) {
      title = h1(heading);
    }
    const newsDetails = div({ class: 'news-details' });
    const categorySection = div({ class: 'news-article-category' });
    const clearDiv = div({ class: 'clear' });
    categorySection.textContent = getMetadata('category');
    const dateSection = div({ class: 'news-article-date' });
    dateSection.textContent = getMetadata('date');
    newsDetails.appendChild(categorySection);
    newsDetails.appendChild(dateSection);
    const innerDiv = div({ class: 'news-article-inner' });
    innerDiv.append(newsDetails, title, sidebar, articleContent, clearDiv);
    newsDiv.append(innerDiv, buttonDiv);
  } else if (rightAlignSidebar.classList.contains('right')) {
    if (language === 'en') {
      sidebar.innerHTML = `
        <div class="author">Written by</div>
          ${author}
        <div> Follow us </div>
      `;
    } else if (language === 'fr') {
      sidebar.innerHTML = `
        <div class="author">Rédaction</div>
          ${author}
        <div> Nous suivre </div>
      `;
    }
    const linkedin = a({ href: 'https://www.linkedin.com/company/audemars-piguet-foundations/', target: '_blank' }, '↳ LinkedIn');
    sidebar.appendChild(linkedin);
    const articleContent = newsDiv.querySelector('.default-content-wrapper');
    const clearDiv = div({ class: 'clear' });
    const innerDiv = div({ class: 'news-article-inner' });
    innerDiv.append(sidebar, articleContent, clearDiv);
    newsDiv.append(innerDiv, buttonDiv);
  }
  // Add a clear div after the first paragraph to ensure the second paragraph
  // remains in the float: right position for large screen sizes
  const textPara = doc.querySelector('.section.articlecontent-container + div .default-content-wrapper p:first-of-type');
  const clearDiv = div({ class: 'clear' });
  if (textPara) {
    textPara.insertAdjacentElement('afterend', clearDiv);
  }

  // Move text content and image content to be encased by different divs
  const whiteLilacSection = doc.querySelector('.section.articlecontent-container + div');
  const allParas = doc.querySelectorAll('.section.articlecontent-container + div div > p');
  const defaultDiv = doc.querySelector('.section.articlecontent-container + div div.default-content-wrapper');
  const ImageDiv = document.createElement('div');
  ImageDiv.className = 'image-wrapper';

  if (allParas && defaultDiv && whiteLilacSection) {
    defaultDiv.innerHTML = ''; // Clear the default content wrapper
    let numTextPara = 0;
    let numImagePara = 0;
    allParas.forEach((p) => {
      if (!p.querySelector('picture')) {
        defaultDiv.appendChild(p);
        numTextPara += 1;
      } else if (p.querySelector('picture')) {
        ImageDiv.appendChild(p);
        numImagePara += 1;
      }
    });
    if (numTextPara > 0) {
      whiteLilacSection.appendChild(defaultDiv);
      whiteLilacSection.appendChild(clearDiv.cloneNode());
    }
    if (numImagePara > 0) {
      whiteLilacSection.appendChild(ImageDiv);
      whiteLilacSection.appendChild(clearDiv.cloneNode());
    }
  }

  // apply fade out animation to news detail section
  const pictureEl = doc.querySelector('.section.articlecontent-container + div div.image-wrapper p picture');
  const imagePara = doc.querySelector('.section.articlecontent-container + div div.image-wrapper p');
  if (pictureEl && imagePara) {
    applyFadeUpAnimation(pictureEl, imagePara);
  }
}
