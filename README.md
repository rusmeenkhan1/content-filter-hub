# Content Filter Hub
 Search, filter, sort and explore - find exactly what you're looking for with powerful real-time content filtering. 

# Features
- **News Landing Page**  
  - Filter content by category  
  - View all articles  
  - Search functionality
  - Clear search text
  - Sort results by date  

- **Projects Landing Page**  
  - Includes all features available on the News Landing Page  
  - Additional nested filtering:  
    - Select a category and then refine results by location  
    - Displays only the articles that match both conditions  

## Environments

  News-Landing (en)
  - Preview: https://main--content-filter-hub--rusmeenkhan1.aem.page/en/news
  - Live: https://main--content-filter-hub--rusmeenkhan1.aem.live/en/news
    
   News-Landing (fr)
  - Preview: https://main--content-filter-hub--rusmeenkhan1.aem.page/fr/actualites
  - Live: https://main--content-filter-hub--rusmeenkhan1.aem.live/fr/actualites

  Projects-Landing(en)
  - Preview: https://main--content-filter-hub--rusmeenkhan1.aem.page/en/projects
  - Live: https://main--content-filter-hub--rusmeenkhan1.aem.live/en/projects

  Projects-Landing(fr)
  - Preview: https://main--content-filter-hub--rusmeenkhan1.aem.page/fr/projets
  - Live: https://main--content-filter-hub--rusmeenkhan1.aem.live/fr/projets

## Configuration

# Placeholders Setup
 We use a central **placeholders sheet** at the root of the content repository to manage multilingual text for the News Landing and Projects Landing pages.
### Example
- On the **Projects Landing Page**:  
  - `projects-landing-view-filter` → will display **“View all”**  
  - `projects-landing-search-filter` → will display **“Search…”**  
  - `projects-landing-location-filter` → will display **“Location”**  
  - `projects-landing-category-filter` → will display **“Category”**  

- On the **News Landing Page**:  
  - `news-landing-view-filter` → will display **“View all”**  
  - `news-landing-search-filter` → will display **“Search…”**  
  - `news-landing-category-filter` → will display **“Category”**  

The system automatically picks the correct text based on the **active language** (`en` or `fr`). 

# Metadata Sheet
  Created a metadata sheet for mapping between url and template. 
### Example
  /en/projects is mapped to projects-landing

## Usage
1. Create placeholders sheet in your site root and put text which need to be shown according to page and language.
2. Create a metadata sheet for mapping urls with template.
3. Preview/publish changes to see them take effect.

# Language Detection
The system automatically detects the current language from the URL path using the getLanguage() function. This logic is implemented in scripts/scripts.js and handles the URL parsing and language detection.
- Fetch mappings from placeholders - see fetchPlaceholders() in aem.js
- Fetch mapping from metadata - see loadTemplate() in scripts.js

  
The landing templates (`/templates/news-landing.js` and `/templates/project-landing.js`) power the filtering and search functionality on the News and Projects landing pages.  
### Data Flow
1. **Fetch Data**  
   - `getNewsdata()` retrieves raw content from `news-index.json` (or `projects-index.json`), using `ffetch`.  
   - Filters results by language (`/en/news/` or `/fr/actualites/`).  

2. **Render Articles**  
   - `showNewsArticles()` creates article cards (image, title, category, date, description).  
   - Adds CSS classes for layout and article color.  
   - Applies **fade-up animations** for a smooth entry effect.  

3. **Decorate Page**  
   - `decorate()` initializes the landing page:  
     - Builds **filter UI** (Category dropdown, View All, Search box, Date sort buttons).  
     - Loads placeholders from the `placeholders` sheet for multilingual support.  
     - Populates category dropdown dynamically from available article metadata.  

4. **User Interactions**  
   - **Category Filter:** Filters articles by category.  
   - **Search:** Filters articles by title (with debounce for performance).  
   - **View All:** Resets category and search filters.  
   - **Sorting:**  
     - Sort by latest date (`filter-top-btn`).  
     - Sort by oldest date (`filter-bottom-btn`).  
   - **Clear Search:** Clears search input and resets listing.  
   - Responsive input widths are adjusted dynamically with `setInputWidthToText()`. 


## Project Structure

```
content-filter-hub/
├── scripts/
│   ├── scripts.js              # Main client-side logic and page lifecycle
│   ├── dom-helpers.js          # DOM utility functions (div, input, etc.)
│   ├── ffetch.js               # Fetch helper for chunked data
│   ├── aem.js                  # AEM utility functions (placeholders, etc.)
│   └── utils.js                # UI helpers (animations, input width, etc.)
├── templates/
│   └── news-landing/
│       ├── news-landing.js     # News landing page template logic
│       └── news-landing.css    # News landing page styles
├── styles/
│   ├── fonts.css               # Custom fonts
│   └── lazy-styles.css         # Styles loaded lazily
├── placeholders.json           # Placeholder data for multi-language and categories
├── package.json                # Project metadata and dependencies
├── README.md                   # Project documentation
└── ...
```

# Troubleshooting
**Placeholders or metadata not loading:**  
    - Check that `placeholders.json` exists and is correctly formatted.
    - Similarly check for `metadata.json` exists and correctly mapped.

**Check if News articles are published and data is coming in news-index.json**
    - similarly check for project-articles pages are previewed and published.


 

