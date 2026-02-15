# Menu data

## Populating from `menu.csv`

Menu JSON is generated from the CSV at the **project root**: `menu.csv`.

**CSV columns** (mapped to JSON):

- `category` → category name (items are grouped by this)
- `name` → item name
- `description` → item description
- `price` → item price (number or string)
- `tags` (optional) → comma/semicolon-separated tags, stored as an array

**Generate `menu.json`:**

```bash
npm run build-menu
```

This runs `scripts/build-menu-from-csv.js`, which parses every row of `menu.csv`, groups items by category, and writes `data/menu.json`. All rows are preserved.

## `menu.json`

The app loads this file via `GET /api/menu` and shows it on the homepage (“Highlights From Our Menu”) and the menu page.

**Shape:** an object with a `categories` array. Each category has:

- `name` (string) — category title
- `image` (string, optional) — path for the category image (set by the build script from a fixed mapping)
- `items` (array) — list of items, each with:
  - `name` (string)
  - `description` (string)
  - `image` (string, optional)
  - `price` (number or string)
  - `tags` (array, optional) — only present if the CSV has a `tags` column

After editing `menu.csv`, run `npm run build-menu` and reload the site.
