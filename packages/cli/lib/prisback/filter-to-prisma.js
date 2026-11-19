'use strict';

/**
 * Map LoopBack-style filter JSON → Prisma findMany args.
 * Supports: where (eq shorthand + gt/gte/lt/lte/inq/nin/neq/and/or),
 * order / orderBy, limit→take, skip/offset, include.
 */
function filterToPrisma(filter) {
  if (!filter || typeof filter !== 'object') return {};
  const out = {};

  if (filter.where != null) {
    out.where = mapWhere(filter.where);
  }

  if (filter.orderBy != null) {
    out.orderBy = filter.orderBy;
  } else if (filter.order != null) {
    out.orderBy = mapOrder(filter.order);
  }

  if (filter.limit != null) out.take = Number(filter.limit);
  else if (filter.take != null) out.take = Number(filter.take);

  if (filter.skip != null) out.skip = Number(filter.skip);
  else if (filter.offset != null) out.skip = Number(filter.offset);

  if (filter.include != null) out.include = filter.include;

  return out;
}

function mapOrder(order) {
  const list = Array.isArray(order) ? order : [order];
  return list
    .map(item => {
      if (typeof item !== 'string') return item;
      const [field, dir] = item.trim().split(/\s+/);
      if (!field) return undefined;
      return {[field]: (dir || 'ASC').toLowerCase() === 'desc' ? 'desc' : 'asc'};
    })
    .filter(Boolean);
}

function mapWhere(where) {
  if (where == null || typeof where !== 'object') return where;
  if (Array.isArray(where)) return where.map(mapWhere);

  const out = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' || key === 'or') {
      out[key] = Array.isArray(value) ? value.map(mapWhere) : mapWhere(value);
      continue;
    }
    out[key] = mapPredicate(value);
  }
  return out;
}

function mapPredicate(value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return value; // shorthand eq
  }
  const out = {};
  for (const [op, v] of Object.entries(value)) {
    switch (op) {
      case 'eq':
        return v;
      case 'neq':
        out.not = v;
        break;
      case 'inq':
        out.in = v;
        break;
      case 'nin':
        out.notIn = v;
        break;
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      case 'contains':
      case 'startsWith':
      case 'endsWith':
        out[op] = v;
        break;
      case 'like':
      case 'ilike':
        out.contains = v;
        out.mode = op === 'ilike' ? 'insensitive' : undefined;
        if (!out.mode) delete out.mode;
        break;
      case 'between':
        if (Array.isArray(v) && v.length >= 2) {
          out.gte = v[0];
          out.lte = v[1];
        }
        break;
      default:
        out[op] = v;
    }
  }
  return out;
}

/** Source emitted into generated repositories (keep in sync with filterToPrisma). */
function filterHelperSource() {
  return `/** LoopBack-style filter → Prisma findMany args */
function toPrismaQuery(filter?: Record<string, unknown>) {
  if (!filter) return {};
  const q: Record<string, unknown> = {};
  if (filter.where != null) q.where = mapWhere(filter.where);
  if (filter.orderBy != null) q.orderBy = filter.orderBy;
  else if (filter.order != null) q.orderBy = mapOrder(filter.order as any);
  if (filter.limit != null) q.take = Number(filter.limit);
  else if (filter.take != null) q.take = Number(filter.take);
  if (filter.skip != null) q.skip = Number(filter.skip);
  else if (filter.offset != null) q.skip = Number(filter.offset);
  if (filter.include != null) q.include = filter.include;
  return q;
}

function mapOrder(order: string | string[] | object) {
  const list = Array.isArray(order) ? order : [order];
  return list
    .map((item) => {
      if (typeof item !== 'string') return item;
      const [field, dir] = item.trim().split(/\\s+/);
      if (!field) return undefined;
      return {[field]: (dir || 'ASC').toLowerCase() === 'desc' ? 'desc' : 'asc'};
    })
    .filter(Boolean);
}

function mapWhere(where: any): any {
  if (where == null || typeof where !== 'object') return where;
  if (Array.isArray(where)) return where.map(mapWhere);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' || key === 'or') {
      out[key] = Array.isArray(value) ? value.map(mapWhere) : mapWhere(value);
      continue;
    }
    out[key] = mapPredicate(value);
  }
  return out;
}

function mapPredicate(value: any): any {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [op, v] of Object.entries(value)) {
    switch (op) {
      case 'eq':
        return v;
      case 'neq':
        out.not = v;
        break;
      case 'inq':
        out.in = v;
        break;
      case 'nin':
        out.notIn = v;
        break;
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      case 'contains':
      case 'startsWith':
      case 'endsWith':
        out[op] = v;
        break;
      case 'like':
      case 'ilike':
        out.contains = v;
        if (op === 'ilike') out.mode = 'insensitive';
        break;
      case 'between':
        if (Array.isArray(v) && v.length >= 2) {
          out.gte = v[0];
          out.lte = v[1];
        }
        break;
      default:
        out[op] = v;
    }
  }
  return out;
}
`;
}

module.exports = {filterToPrisma, mapWhere, mapOrder, filterHelperSource};
