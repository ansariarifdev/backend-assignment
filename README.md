# codvector_internship_assignment

# Pagination Strategy & Design Decisions

## Problem Statement

The system needs to support:

* Browsing approximately 200,000 products
* Sorting products by newest first
* Filtering by category
* Fast pagination
* Consistent results while data is changing

A key requirement is:

> If new products are added or existing products are updated while a user is browsing, they must not see duplicate products or miss products that should have appeared in their result set.

---

# Initial Approach: Offset-Based Pagination

The most straightforward implementation is offset-based pagination.

Example:

```sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

Page 2:

```sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

API:

```http
GET /products?page=1&limit=20
```

## Advantages

* Simple to understand
* Easy to implement
* Supports page numbers naturally

## Problems

### 1. Poor Performance

For large datasets, the database must scan and discard rows before returning results.

Example:

```sql
LIMIT 20 OFFSET 100000;
```

The database still processes the first 100,000 rows before returning the next 20.

As the offset grows, query performance degrades significantly.

---

### 2. Duplicate Records

Assume the user loads Page 1.

```text
P100
P99
P98
...
P81
```

A new product is inserted:

```text
P101
```

The ordering becomes:

```text
P101
P100
P99
...
```

When the user requests Page 2 using OFFSET 20, the position of all rows has shifted.

As a result:

```text
P81
```

may appear again.

The user sees duplicate data.

---

### 3. Missing Records

If multiple products are inserted while the user is browsing, some products may shift across page boundaries.

The user can completely miss products that should have appeared in their browsing session.

---

## Conclusion

Offset pagination fails both consistency and scalability requirements.

---

# Second Approach: Cursor-Based Pagination

To improve performance, cursor-based pagination was considered.

Instead of using offsets, the last item from the previous page becomes the starting point for the next page.

Example:

```http
GET /products?cursor=abc123
```

Query pattern:

```sql
SELECT *
FROM products
WHERE created_at < :cursorCreatedAt
ORDER BY created_at DESC
LIMIT 20;
```

---

## Advantages

### 1. Fast Pagination

The database can use indexes efficiently.

Instead of scanning thousands of rows, it can jump directly to the cursor position.

Complexity becomes approximately:

```text
O(page_size)
```

instead of:

```text
O(offset)
```

---

### 2. No Duplicates From Inserts

New products inserted after the cursor position do not affect subsequent pages.

This solves the duplicate-record problem caused by offset pagination.

---

## Remaining Problem

Cursor pagination alone does not guarantee a consistent view of the dataset.

Consider:

```text
User loads page 1
```

Then:

```text
50 products are updated
```

If updates change the sorting order, products can move across cursor boundaries.

This can cause:

* Missing products
* Reordered results
* Inconsistent browsing experience

Although cursor pagination solves performance issues, it does not fully satisfy the consistency requirement.

---

# Final Approach: Cursor Pagination + Snapshot

To guarantee consistency, the solution introduces the concept of a snapshot.

When a user requests the first page:

```http
GET /products?categoryId=electronics
```

The backend captures the current snapshot identifier.

Example:

```json
{
  "snapshotVersion": 1500000
}
```

This snapshot remains fixed for the entire browsing session.

---

## First Request

```http
GET /products?limit=20
```

Response:

```json
{
  "snapshotVersion": 1500000,
  "nextCursor": {
    "version": 1499981,
    "productId": "prod_abc"
  },
  "items": [...]
}
```

---

## Subsequent Requests

```http
GET /products
?limit=20
&snapshotVersion=1500000
&cursorVersion=1499981
&cursorProductId=prod_abc
```

The backend always queries within the same snapshot boundary.

---

# Why This Works

## Solves Performance

Pagination is still cursor-based.

Queries continue to use indexes efficiently.

No large offsets are scanned.

Performance remains stable regardless of page depth.

---

## Solves Duplicate Records

New products inserted after the browsing session begins receive versions greater than the snapshot version.

Example:

```text
snapshotVersion = 1500000
new product version = 1500001
```

The query only considers:

```sql
WHERE version <= 1500000
```

Therefore, newly inserted products never affect the current browsing session.

No duplicates occur.

---

## Solves Missing Records

Updates create newer versions that also receive versions greater than the snapshot.

The user continues browsing against the same frozen dataset.

Products cannot move across cursor boundaries while the user is paging through results.

No records are skipped.

---

# Database Indexing

To support efficient querying, indexes are created for:

```sql
(category_id, version DESC)
(version DESC)
```

These indexes allow:

* Fast category filtering
* Fast sorting
* Efficient cursor traversal

---

# Trade-Offs

### Pros

* Fast pagination
* No duplicates
* No missing records
* Consistent browsing experience
* Scales well to large datasets

### Cons

* More complex than offset pagination
* Requires snapshot management
* Cursor-based APIs do not support arbitrary page numbers efficiently

---

# Final Decision

The final implementation uses:

* Cursor-based pagination
* Snapshot-based consistency
* Indexed queries
* Category filtering

This approach satisfies both primary requirements:

1. Fast pagination for large datasets.
2. Consistent results even when products are added or updated during browsing.





To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
