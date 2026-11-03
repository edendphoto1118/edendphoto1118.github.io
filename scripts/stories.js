(() => {
  globalThis.generateStories = function () {
    const stories = Array.isArray(globalThis.EDEN_STORIES) ? globalThis.EDEN_STORIES : [];
    const section = document.getElementById('gallery-story');
    const container = document.getElementById('container-story');
    if (!section || !container) return;
    section.hidden = !stories.length;
    const rail = document.createElement('div');
    rail.className = 'story-rail';
    rail.setAttribute('aria-label', '敘事企劃');
    const readers = document.createElement('div');
    readers.className = 'story-readers';
    container.replaceChildren(rail, readers);
    let active = null;

    const image = (story, file, label) => {
      const img = document.createElement('img');
      const source = `${story.path}${encodeURIComponent(file)}`;
      img.src = source.replace(/^images\/works\//, 'images/previews/works/').replace(/\.[^.]+$/, '.webp');
      img.dataset.fullSrc = source;
      img.alt = label;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => { img.src = source; }, { once: true });
      return img;
    };

    stories.forEach((story, index) => {
      if (!story.pages?.length) return;
      const item = document.createElement('article');
      item.className = 'story-item';
      const cover = document.createElement('button');
      cover.type = 'button';
      cover.className = 'story-cover';
      cover.setAttribute('aria-expanded', 'false');
      cover.setAttribute('aria-controls', `story-pages-${index}`);
      cover.setAttribute('aria-label', `展開 ${story.title}，共 ${story.pages.length} 頁`);
      cover.append(image(story, story.pages[0], story.title));
      const caption = document.createElement('span');
      caption.className = 'story-caption';
      const title = document.createElement('span');
      title.textContent = story.title;
      const count = document.createElement('span');
      count.textContent = `${story.pages.length} 頁  ＋`;
      caption.append(title, count);
      cover.append(caption);

      const panel = document.createElement('div');
      panel.id = `story-pages-${index}`;
      panel.className = 'story-panel';
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-label', `${story.title} 完整閱讀區`);
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
      const pages = document.createElement('div');
      pages.className = 'story-pages';
      pages.setAttribute('aria-label', `${story.title} 內頁`);
      let loaded = false;
      const close = () => {
        item.classList.remove('is-open');
        cover.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
        panel.inert = true;
        count.textContent = `${story.pages.length} 頁  ＋`;
        if (active === close) active = null;
      };
      const open = () => {
        if (active && active !== close) active();
        if (!loaded) {
          const files = story.pages;
          files.forEach((file, pageIndex) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'story-page';
            button.setAttribute('aria-label', `放大 ${story.title} 第 ${pageIndex + 1} 頁`);
            const img = image(story, file, `${story.title} / ${file}`);
            button.append(img);
            button.addEventListener('click', () => openLightbox(img));
            pages.append(button);
          });
          loaded = true;
        }
        item.classList.add('is-open');
        cover.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
        panel.inert = false;
        count.textContent = `${story.pages.length} 頁  −`;
        active = close;
      };
      item.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') open(); });
      cover.addEventListener('click', () => {
        open();
        requestAnimationFrame(() => panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
      });
      item.addEventListener('keydown', (event) => { if (event.key === 'Escape') { close(); cover.focus(); } });
      panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') { close(); cover.focus(); } });
      const controls = document.createElement('div');
      controls.className = 'story-controls';
      const heading = document.createElement('span');
      heading.className = 'story-reader-title';
      heading.textContent = `${story.title} / ${story.pages.length} 頁`;
      controls.append(heading);
      [-1, 1].forEach((direction) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rail-nav-btn';
        button.textContent = direction < 0 ? '‹' : '›';
        button.setAttribute('aria-label', direction < 0 ? '前一組頁面' : '後一組頁面');
        button.addEventListener('click', () => pages.scrollBy({ left: direction * pages.clientWidth * 0.85, behavior: 'smooth' }));
        controls.append(button);
      });
      panel.append(controls, pages);
      item.append(cover);
      rail.append(item);
      readers.append(panel);
      enableSilkyHorizontalRail(pages);
      pages.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
      pages.addEventListener('pointerdown', (event) => event.stopPropagation());
    });
    enableSilkyHorizontalRail(rail);
  };
})();
