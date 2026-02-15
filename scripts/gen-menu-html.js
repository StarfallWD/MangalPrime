const fs = require('fs');
const path = require('path');
const menu = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'menu.json'), 'utf8'));

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function itemHtml(item) {
  const price = item.price != null ? '$' + Number(item.price).toFixed(2) : '—';
  return '<li><ul class="name__price"><li>' + esc(item.name) + '</li><li>' + esc(price) + '</li></ul><p>' + esc(item.description || '') + '</p></li>';
}

function menuBlockHtml(items, showTitle) {
  const itemsHtml = items.map(itemHtml).join('');
  const titleBlock = showTitle ? '<div class="sub____title"><span>' + esc(showTitle) + '</span></div>' : '';
  return (
    '<div class="col-lg-4 col-md-12 col-sm-12">' +
    '<div class="menu__text__block">' +
    titleBlock +
    '<div class="menu__list">' +
    '<ul class="name__price__shrtd body__one">' + itemsHtml + '</ul>' +
    '</div></div></div>'
  );
}

function tabImgHtml(imgUrl) {
  const src = imgUrl || '/assets/images/resource/menu-01.png';
  return (
    '<div class="col-lg-4 col-md-12 col-sm-12">' +
    '<div class="tab__img" style="background-image: url(' + esc(src) + ');">' +
    '<div class="tab__img_feature_image">' +
    '<img class="d-block d-lg-none" src="' + esc(src) + '" alt="">' +
    '</div></div></div>'
  );
}

let html = '';
menu.categories.forEach((cat, i) => {
  const tid = 'tab-' + (i + 1);
  const active = i === 0 ? 'tab active-tab' : 'tab';
  const style = i === 0 ? '' : ' style="display:none;"';
  const items = cat.items || [];
  const imgUrl = cat.image || '/assets/images/resource/menu-01.png';

  // Split items into two columns (original layout: 2 menu blocks + 1 image)
  const mid = Math.ceil(items.length / 2);
  const col1Items = items.slice(0, mid);
  const col2Items = items.slice(mid);

  const col1 = menuBlockHtml(col1Items, cat.name);
  const col2 = col2Items.length > 0 ? menuBlockHtml(col2Items, null) : '';
  const imgCol = tabImgHtml(imgUrl);

  const cols = col2 ? [col1, col2, imgCol] : [col1, imgCol];

  html += '<div class="' + active + '" id="' + tid + '"' + style + '>' +
    '<div class="inner-box">' +
    '<div class="row clearfix">' +
    cols.join('') +
    '</div></div></div>';
});

const menuHtmlPath = path.join(__dirname, '..', 'views', 'menu.html');
let menuHtml = fs.readFileSync(menuHtmlPath, 'utf8');
const placeholder = /<div class="tabs-content wow fadeInUp animated" data-wow-delay="00ms" data-wow-duration="3000ms" id="our-choice-menu-tabs">[\s\S]*?                    <\/div>(?=\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/section>)/;
const replacement = '<div class="tabs-content wow fadeInUp animated" data-wow-delay="00ms" data-wow-duration="3000ms" id="our-choice-menu-tabs">\n                        ' + html + '\n                    </div>';
menuHtml = menuHtml.replace(placeholder, replacement);
fs.writeFileSync(menuHtmlPath, menuHtml);
console.log('Updated menu.html with menu content');
