/**
 * Reads menu.csv from project root, parses rows, groups by category,
 * and writes data/menu.json. Maps CSV headers to JSON: name, category, price, description, tags.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'menu.csv');
const JSON_PATH = path.join(ROOT, 'data', 'menu.json');

// Distinct image per category (menu-01 through menu-08, sfood for extras)
const CATEGORY_IMAGES = {
  'Cold Appetizers': '/assets/images/resource/menu-01.png',
  'Hot Appetizers': '/assets/images/resource/menu-02.png',
  'Salads': '/assets/images/resource/menu-03.png',
  'Soups': '/assets/images/resource/menu-04.png',
  'Grill': '/assets/images/resource/menu-05.png',
  'Doners': '/assets/images/resource/menu-06.png',
  'Pan Dishes': '/assets/images/resource/menu-07.png',
  'From the Oven': '/assets/images/resource/menu-08.png',
  'Pasta': '/assets/images/resource/sfood-01.png',
  'Kids': '/assets/images/resource/sfood-02.png',
  'Side Orders': '/assets/images/resource/sfood-03.png',
  'Drinks': '/assets/images/resource/food-slider-01.png'
};

/**
 * Parse a single CSV line respecting double-quoted fields (commas inside quotes).
 */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * Parse CSV string into array of rows (each row = array of cell values).
 */
function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  return { headers, rows };
}

/**
 * Normalize header to a key (e.g. "Price" -> "price", "Category" -> "category").
 */
function headerToKey(h) {
  return String(h).trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Build menu JSON from CSV path. Preserves all rows, groups by category.
 */
function buildMenuJson(csvPath) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { headers, rows } = parseCsv(csvText);
  const keyIndex = {};
  headers.forEach((h, i) => {
    keyIndex[headerToKey(h)] = i;
  });

  const categoryIndex = keyIndex.category ?? keyIndex.category_name;
  const nameIndex = keyIndex.name ?? keyIndex.item_name;
  const descIndex = keyIndex.description ?? keyIndex.desc;
  const priceIndex = keyIndex.price ?? keyIndex.price_amount;
  const tagsIndex = keyIndex.tags ?? keyIndex.tag;

  if (categoryIndex == null || nameIndex == null) {
    throw new Error('CSV must have at least "category" and "name" columns. Found headers: ' + headers.join(', '));
  }

  const byCategory = new Map(); // category name -> array of items

  for (const row of rows) {
    const category = row[categoryIndex] != null ? String(row[categoryIndex]).trim() : '';
    const name = row[nameIndex] != null ? String(row[nameIndex]).trim() : '';
    if (!category && !name) continue;

    const description = descIndex != null && row[descIndex] != null ? String(row[descIndex]).trim() : '';
    let price = priceIndex != null && row[priceIndex] != null ? row[priceIndex] : '';
    if (typeof price === 'string') {
      const num = parseFloat(price.replace(/[^0-9.]/g, ''));
      price = Number.isFinite(num) ? num : price;
    }
    let tags = [];
    if (tagsIndex != null && row[tagsIndex] != null && String(row[tagsIndex]).trim()) {
      tags = String(row[tagsIndex])
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const item = {
      name,
      description,
      image: '',
      price: price === '' ? '—' : price,
      ...(tags.length ? { tags } : {})
    };

    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(item);
  }

  const categories = [];
  for (const [catName, items] of byCategory.entries()) {
    if (items.length === 0) continue;
    const cat = {
      name: catName,
      items
    };
    if (CATEGORY_IMAGES[catName]) cat.image = CATEGORY_IMAGES[catName];
    categories.push(cat);
  }

  return { categories };
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('Missing menu.csv at project root:', CSV_PATH);
    process.exit(1);
  }
  const menu = buildMenuJson(CSV_PATH);
  const dir = path.dirname(JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(menu, null, 2), 'utf8');
  console.log('Wrote', menu.categories.length, 'categories to', JSON_PATH);
}

main();
