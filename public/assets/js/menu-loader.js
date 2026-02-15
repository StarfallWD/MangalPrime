/**
 * Loads menu from /api/menu (data/menu.json) and renders it on the homepage
 * and menu page. Keeps existing layout and styling.
 */
(function () {
  function formatPrice(price) {
    if (price === undefined || price === null) return '—';
    if (typeof price === 'number') return '$' + price.toFixed(2);
    return String(price);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildMenuItemLi(item) {
    var price = formatPrice(item.price);
    return (
      '<li>' +
      '<ul class="name__price">' +
      '<li>' + escapeHtml(item.name) + '</li>' +
      '<li>' + escapeHtml(price) + '</li>' +
      '</ul>' +
      '<p>' + escapeHtml(item.description || '') + '</p>' +
      '</li>'
    );
  }

  function buildCategorySlide(category, index, maxItemsPerCategory) {
    var imageUrl = category.image || '/assets/images/resource/menu-01.png';
    var imageAlt = escapeHtml(category.name);
    var items = category.items || [];
    if (maxItemsPerCategory && maxItemsPerCategory > 0) {
      items = items.slice(0, maxItemsPerCategory);
    }
    var itemsHtml = items.map(buildMenuItemLi).join('');
    var imgBlock = '<div class="menu__img__block"><figure><img src="' + escapeHtml(imageUrl) + '" alt="' + imageAlt + '"></figure></div>';
    var textBlock =
      '<div class="menu__text__block">' +
      '<div class="sub____title"><span>' + escapeHtml(category.name) + '</span></div>' +
      '<div class="menu__list">' +
      '<ul class="name__price__shrtd body__one">' + itemsHtml + '</ul>' +
      '</div></div>';

    var blockContent = index % 2 === 0
      ? imgBlock + textBlock
      : textBlock + imgBlock;

    return '<div class="swiper-slide"><div class="menu__from__block">' + blockContent + '</div></div>';
  }

  function buildHomeHighlights(wrapper, categories) {
    if (!wrapper || !categories || !categories.length) return;
    var slidesHtml = categories.map(function (cat, i) { return buildCategorySlide(cat, i, 5); }).join('');
    wrapper.innerHTML = slidesHtml;
  }

  function syncMenuListItemHeights(wrapper) {
    if (!wrapper || !wrapper.children.length) return;
    var slides = Array.prototype.slice.call(wrapper.children);
    var lists = slides.map(function (slide) {
      var block = slide.querySelector('.menu__from__block');
      if (!block) return null;
      var list = block.querySelector('.name__price__shrtd.body__one');
      return list ? Array.prototype.slice.call(list.children).filter(function (n) { return n.tagName === 'LI'; }) : null;
    }).filter(Boolean);
    if (lists.length === 0) return;
    var maxLen = Math.max.apply(null, lists.map(function (arr) { return arr.length; }));
    for (var i = 0; i < maxLen; i++) {
      var rowItems = lists.map(function (arr) { return arr[i]; }).filter(Boolean);
      if (rowItems.length === 0) continue;
      rowItems.forEach(function (el) {
        el.style.minHeight = '';
        el.style.height = 'auto';
      });
      var maxH = Math.max.apply(null, rowItems.map(function (el) { return el.offsetHeight; }));
      rowItems.forEach(function (el) {
        el.style.height = maxH + 'px';
        el.style.minHeight = maxH + 'px';
        el.style.boxSizing = 'border-box';
        el.classList.add('menu-item-row-synced');
      });
    }
  }

  function initMenuSwiper(container) {
    if (!container || !window.Swiper) return null;
    var dragSize = container.getAttribute('data-drag-size') ? parseInt(container.getAttribute('data-drag-size'), 10) : 350;
    var scrollbarEl = container.querySelector('.swiper-scrollbar');
    return new window.Swiper(container, {
      direction: 'horizontal',
      loop: false,
      freeMode: false,
      watchOverflow: true,
      spaceBetween: 30,
      breakpoints: {
        1920: { slidesPerView: 3 },
        992: { slidesPerView: 2 },
        480: { slidesPerView: 1 }
      },
      scrollbar: scrollbarEl ? {
        el: scrollbarEl,
        draggable: true,
        dragSize: dragSize
      } : undefined
    });
  }

  function buildItemBlockWithImage(item) {
    var price = formatPrice(item.price);
    var imgSrc = (item.image && item.image.trim()) ? item.image : '/assets/images/menu-item/menu-item-01.png';
    return (
      '<li>' +
      '<div class="menu__content__block">' +
      '<div class="menu__item__img"><figure><img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(item.name) + '"></figure></div>' +
      '<div class="menu__content">' +
      '<ul class="name__price"><li>' + escapeHtml(item.name) + '</li><li>' + escapeHtml(price) + '</li></ul>' +
      '<p>' + escapeHtml(item.description || '') + '</p>' +
      '</div></div></li>'
    );
  }

  function buildMenuPageCategories(container, categories) {
    if (!container || !categories || !categories.length) return;
    var cols = categories.map(function (cat, i) {
      return '<div class="col-lg-4 col-md-6 col-sm-12">' + buildCategorySlide(cat, i) + '</div>';
    });
    container.innerHTML = '<div class="row">' + cols.join('') + '</div>';
  }

  function buildOurChoiceTabsContent(container, categories) {
    if (!container || !categories || !categories.length) return;
    if (container.children.length > 0) return; // static HTML already present
    var tabContent = categories.map(function (cat, i) {
      var tabId = 'tab-' + (i + 1);
      var activeClass = i === 0 ? ' tab active-tab' : ' tab';
      var itemsHtml = (cat.items || []).map(buildMenuItemLi).join('');
      return (
        '<div class="' + activeClass + '" id="' + tabId + '" style="' + (i === 0 ? '' : 'display:none;') + '">' +
        '<div class="inner-box">' +
        '<div class="row clearfix">' +
        '<div class="col-12">' +
        '<div class="menu__text__block">' +
        '<div class="menu__list">' +
        '<ul class="name__price__shrtd body__one">' + itemsHtml + '</ul>' +
        '</div></div></div></div></div>'
      );
    }).join('');
    container.innerHTML = tabContent;
  }

  function buildMenuPageItemsSection(leftCol, rightCol, categories) {
    var allItems = [];
    (categories || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        allItems.push(item);
      });
    });
    var half = Math.ceil(allItems.length / 2);
    var leftItems = allItems.slice(0, half);
    var rightItems = allItems.slice(half);
    var listClass = 'name__price__shrtd body__one two';
    var leftHtml = leftItems.map(buildItemBlockWithImage).join('');
    var rightHtml = rightItems.map(buildItemBlockWithImage).join('');
    if (leftCol) {
      leftCol.innerHTML = '<div class="menu__text__block"><div class="menu__list">' +
        '<ul class="' + listClass + '">' + leftHtml + '</ul></div></div>';
    }
    if (rightCol) {
      rightCol.innerHTML = '<div class="menu__text__block"><div class="menu__list">' +
        '<ul class="name__price__shrtd body__one">' + rightHtml + '</ul></div></div>';
    }
  }

  function run() {
    fetch('/api/menu')
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('Menu load failed')); })
      .then(function (data) {
        var categories = data.categories || [];
        var highlightsWrapper = document.getElementById('menu-highlights-wrapper');
        var menuPageCategories = document.getElementById('menu-page-categories');
        var menuPageItemsLeft = document.getElementById('menu-page-items-left');
        var menuPageItemsRight = document.getElementById('menu-page-items-right');
        var dynamicSwiperContainer = document.querySelector('.swiper-container[data-dynamic-menu]');

        if (highlightsWrapper && dynamicSwiperContainer) {
          buildHomeHighlights(highlightsWrapper, categories);
          initMenuSwiper(dynamicSwiperContainer);
          requestAnimationFrame(function () {
            syncMenuListItemHeights(highlightsWrapper);
          });
          var resizeTimeout;
          window.addEventListener('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
              syncMenuListItemHeights(highlightsWrapper);
            }, 150);
          });
        }

        if (menuPageCategories) {
          buildMenuPageCategories(menuPageCategories, categories);
          var menuPageContainer = menuPageCategories.closest('.swiper-container');
          if (menuPageContainer) initMenuSwiper(menuPageContainer);
        }

        if (menuPageItemsLeft || menuPageItemsRight) {
          buildMenuPageItemsSection(menuPageItemsLeft, menuPageItemsRight, categories);
        }

        var ourChoiceTabs = document.getElementById('our-choice-menu-tabs');
        if (ourChoiceTabs) {
          buildOurChoiceTabsContent(ourChoiceTabs, categories);
        }
      })
      .catch(function (err) {
        console.error('Menu loader:', err);
        var highlightsWrapper = document.getElementById('menu-highlights-wrapper');
        if (highlightsWrapper) highlightsWrapper.innerHTML = '<p class="menu-load-error">Menu could not be loaded.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
