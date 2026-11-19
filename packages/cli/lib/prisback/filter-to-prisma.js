'use strict';

/**
 * LB4-familiar filter → Prisma findMany args (documented subset).
 *
 * Supported filter keys: where, fields, order, orderBy, limit, take, skip, offset, include
 * Supported where ops: eq, neq, gt, gte, lt, lte, inq, nin, between, and, or,
 *   contains, startsWith, endsWith (Prisma string filters)
 *
 * Unsupported (rejected with 400): like, ilike, nlike, nilike, regexp, near,
 *   exists, match, and unknown operators/keys.
 */

const ALLOWED_FILTER_KEYS = new Set([
  'where',
  'fields',
  'order',
  'orderBy',
  'limit',
  'take',
  'skip',
  'offset',
  'include',
]);

const SUPPORTED_OPS = new Set([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'inq',
  'nin',
  'between',
  'contains',
  'startsWith',
  'endsWith',
]);

const UNSUPPORTED_OPS = new Set([
  'like',
  'ilike',
  'nlike',
  'nilike',
  'regexp',
  'near',
  'exists',
  'match',
]);

/** Default page size when caller omits limit/take (DOS protection). */
const DEFAULT_TAKE = 50;
/** Hard cap on limit/take. */
const MAX_TAKE = 200;

class FilterValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FilterValidationError';
    this.statusCode = 400;
    this.status = 400;
  }
}

function assertFilter(condition, message) {
  if (!condition) throw new FilterValidationError(message);
}

function filterToPrisma(filter) {
  if (filter == null) return {};
  assertFilter(typeof filter === 'object' && !Array.isArray(filter), 'filter must be an object');

  for (const key of Object.keys(filter)) {
    assertFilter(
      ALLOWED_FILTER_KEYS.has(key),
      `Unsupported filter key "${key}". Allowed: ${[...ALLOWED_FILTER_KEYS].join(', ')}`,
    );
  }

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
  else out.take = DEFAULT_TAKE;

  out.take = clampTake(out.take);

  if (filter.skip != null) out.skip = Number(filter.skip);
  else if (filter.offset != null) out.skip = Number(filter.offset);

  if (filter.fields != null) {
    Object.assign(out, mapFields(filter.fields));
  }

  if (filter.include != null) {
    out.include = mapInclude(filter.include);
  }

  return out;
}

function clampTake(n) {
  const take = Number(n);
  assertFilter(Number.isFinite(take) && take > 0, 'limit/take must be a positive number');
  if (take > MAX_TAKE) {
    throw new FilterValidationError(
      `limit/take ${take} exceeds max ${MAX_TAKE}`,
    );
  }
  return take;
}

function mapFields(fields) {
  if (Array.isArray(fields)) {
    assertFilter(fields.length > 0, 'fields array must not be empty');
    const select = {};
    for (const f of fields) {
      assertFilter(typeof f === 'string', 'fields array entries must be strings');
      select[f] = true;
    }
    return {select};
  }

  assertFilter(
    fields && typeof fields === 'object',
    'fields must be a string[] or object',
  );
  const entries = Object.entries(fields);
  assertFilter(entries.length > 0, 'fields object must not be empty');

  const truths = entries.filter(([, v]) => v === true).map(([k]) => k);
  const falses = entries.filter(([, v]) => v === false).map(([k]) => k);
  const other = entries.filter(([, v]) => v !== true && v !== false);

  assertFilter(
    other.length === 0,
    'fields object values must be boolean true/false',
  );

  if (truths.length && !falses.length) {
    const select = {};
    for (const k of truths) select[k] = true;
    return {select};
  }
  if (falses.length && !truths.length) {
    const omit = {};
    for (const k of falses) omit[k] = true;
    return {omit};
  }
  // Mixed include/exclude — LB4 discourages this; take includes only
  const select = {};
  for (const k of truths) select[k] = true;
  assertFilter(Object.keys(select).length > 0, 'fields must include at least one true');
  return {select};
}

function mapInclude(include) {
  if (typeof include === 'string') {
    return {[include]: true};
  }
  if (Array.isArray(include)) {
    const out = {};
    for (const item of include) {
      Object.assign(out, mapInclude(item));
    }
    return out;
  }
  assertFilter(include && typeof include === 'object', 'include must be string, object, or array');

  // Already Prisma-shaped: { posts: true } or { posts: { where: ... } }
  if (!('relation' in include)) {
    return include;
  }

  // LB4: { relation: 'posts', scope?: Filter }
  const name = include.relation;
  assertFilter(typeof name === 'string' && name, 'include.relation must be a string');
  if (include.scope == null) {
    return {[name]: true};
  }
  const scopeQuery = filterToPrisma(include.scope);
  return {[name]: Object.keys(scopeQuery).length ? scopeQuery : true};
}

function mapOrder(order) {
  const list = Array.isArray(order) ? order : [order];
  return list
    .map(item => {
      if (typeof item !== 'string') {
        assertFilter(
          item && typeof item === 'object',
          'order entries must be strings like "name ASC" or Prisma orderBy objects',
        );
        return item;
      }
      const [field, dir] = item.trim().split(/\s+/);
      assertFilter(field, 'invalid order entry');
      const d = (dir || 'ASC').toLowerCase();
      assertFilter(d === 'asc' || d === 'desc', `order direction must be ASC or DESC: "${item}"`);
      return {[field]: d};
    })
    .filter(Boolean);
}

function mapWhere(where) {
  if (where == null || typeof where !== 'object') return where;
  if (Array.isArray(where)) return where.map(mapWhere);

  const out = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' || key === 'or') {
      assertFilter(Array.isArray(value), `"${key}" must be an array`);
      out[key] = value.map(mapWhere);
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
    if (UNSUPPORTED_OPS.has(op)) {
      throw new FilterValidationError(
        `Unsupported where operator "${op}". ` +
          `Supported: ${[...SUPPORTED_OPS].join(', ')}. ` +
          `For strings prefer contains/startsWith/endsWith.`,
      );
    }
    assertFilter(
      SUPPORTED_OPS.has(op),
      `Unsupported where operator "${op}". Supported: ${[...SUPPORTED_OPS].join(', ')}`,
    );
    switch (op) {
      case 'eq':
        return v;
      case 'neq':
        out.not = v;
        break;
      case 'inq':
        assertFilter(Array.isArray(v), 'inq value must be an array');
        out.in = v;
        break;
      case 'nin':
        assertFilter(Array.isArray(v), 'nin value must be an array');
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
      case 'between':
        assertFilter(
          Array.isArray(v) && v.length >= 2,
          'between value must be [min, max]',
        );
        out.gte = v[0];
        out.lte = v[1];
        break;
      default:
        throw new FilterValidationError(`Unsupported where operator "${op}"`);
    }
  }
  return out;
}

/** Source emitted into generated repositories (keep in sync with filterToPrisma). */
function filterHelperSource() {
  return `/** LB4-familiar filter → Prisma (documented subset; unsupported ops → 400) */
const ALLOWED_FILTER_KEYS = new Set([
  'where', 'fields', 'order', 'orderBy', 'limit', 'take', 'skip', 'offset', 'include',
]);
const SUPPORTED_OPS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'inq', 'nin', 'between',
  'contains', 'startsWith', 'endsWith',
]);
const UNSUPPORTED_OPS = new Set([
  'like', 'ilike', 'nlike', 'nilike', 'regexp', 'near', 'exists', 'match',
]);
const DEFAULT_TAKE = 50;
const MAX_TAKE = 200;

function badFilter(message: string): never {
  const err: any = new Error(message);
  err.statusCode = 400;
  err.status = 400;
  err.name = 'FilterValidationError';
  throw err;
}

function clampTake(n: number): number {
  if (!Number.isFinite(n) || n <= 0) badFilter('limit/take must be a positive number');
  if (n > MAX_TAKE) badFilter(\`limit/take \${n} exceeds max \${MAX_TAKE}\`);
  return n;
}

function toPrismaQuery(filter?: Record<string, unknown>) {
  if (filter == null) return {take: DEFAULT_TAKE};
  if (typeof filter !== 'object' || Array.isArray(filter)) {
    badFilter('filter must be an object');
  }
  for (const key of Object.keys(filter)) {
    if (!ALLOWED_FILTER_KEYS.has(key)) {
      badFilter(
        \`Unsupported filter key "\${key}". Allowed: \${[...ALLOWED_FILTER_KEYS].join(', ')}\`,
      );
    }
  }
  const q: Record<string, unknown> = {};
  if (filter.where != null) q.where = mapWhere(filter.where);
  if (filter.orderBy != null) q.orderBy = filter.orderBy;
  else if (filter.order != null) q.orderBy = mapOrder(filter.order as any);
  if (filter.limit != null) q.take = clampTake(Number(filter.limit));
  else if (filter.take != null) q.take = clampTake(Number(filter.take));
  else q.take = DEFAULT_TAKE;
  if (filter.skip != null) q.skip = Number(filter.skip);
  else if (filter.offset != null) q.skip = Number(filter.offset);
  if (filter.fields != null) Object.assign(q, mapFields(filter.fields));
  if (filter.include != null) q.include = mapInclude(filter.include);
  return q;
}

function mapFields(fields: any): {select?: Record<string, true>; omit?: Record<string, true>} {
  if (Array.isArray(fields)) {
    if (!fields.length) badFilter('fields array must not be empty');
    const select: Record<string, true> = {};
    for (const f of fields) {
      if (typeof f !== 'string') badFilter('fields array entries must be strings');
      select[f] = true;
    }
    return {select};
  }
  if (!fields || typeof fields !== 'object') badFilter('fields must be a string[] or object');
  const entries = Object.entries(fields);
  if (!entries.length) badFilter('fields object must not be empty');
  const truths = entries.filter(([, v]) => v === true).map(([k]) => k);
  const falses = entries.filter(([, v]) => v === false).map(([k]) => k);
  if (entries.some(([, v]) => v !== true && v !== false)) {
    badFilter('fields object values must be boolean true/false');
  }
  if (truths.length && !falses.length) {
    const select: Record<string, true> = {};
    for (const k of truths) select[k] = true;
    return {select};
  }
  if (falses.length && !truths.length) {
    const omit: Record<string, true> = {};
    for (const k of falses) omit[k] = true;
    return {omit};
  }
  const select: Record<string, true> = {};
  for (const k of truths) select[k] = true;
  if (!Object.keys(select).length) badFilter('fields must include at least one true');
  return {select};
}

function mapInclude(include: any): any {
  if (typeof include === 'string') return {[include]: true};
  if (Array.isArray(include)) {
    const out: Record<string, unknown> = {};
    for (const item of include) Object.assign(out, mapInclude(item));
    return out;
  }
  if (!include || typeof include !== 'object') {
    badFilter('include must be string, object, or array');
  }
  if (!('relation' in include)) return include; // Prisma-shaped
  const name = include.relation;
  if (typeof name !== 'string' || !name) badFilter('include.relation must be a string');
  if (include.scope == null) return {[name]: true};
  const scopeQuery = toPrismaQuery(include.scope);
  return {[name]: Object.keys(scopeQuery).length ? scopeQuery : true};
}

function mapOrder(order: string | string[] | object) {
  const list = Array.isArray(order) ? order : [order];
  return list
    .map((item) => {
      if (typeof item !== 'string') {
        if (!item || typeof item !== 'object') {
          badFilter('order entries must be strings like "name ASC" or Prisma orderBy objects');
        }
        return item;
      }
      const [field, dir] = item.trim().split(/\\s+/);
      if (!field) badFilter('invalid order entry');
      const d = (dir || 'ASC').toLowerCase();
      if (d !== 'asc' && d !== 'desc') badFilter(\`order direction must be ASC or DESC: "\${item}"\`);
      return {[field]: d};
    })
    .filter(Boolean);
}

function mapWhere(where: any): any {
  if (where == null || typeof where !== 'object') return where;
  if (Array.isArray(where)) return where.map(mapWhere);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' || key === 'or') {
      if (!Array.isArray(value)) badFilter(\`"\${key}" must be an array\`);
      out[key] = value.map(mapWhere);
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
    if (UNSUPPORTED_OPS.has(op)) {
      badFilter(
        \`Unsupported where operator "\${op}". Supported: \${[...SUPPORTED_OPS].join(', ')}. For strings prefer contains/startsWith/endsWith.\`,
      );
    }
    if (!SUPPORTED_OPS.has(op)) {
      badFilter(\`Unsupported where operator "\${op}". Supported: \${[...SUPPORTED_OPS].join(', ')}\`);
    }
    switch (op) {
      case 'eq':
        return v;
      case 'neq':
        out.not = v;
        break;
      case 'inq':
        if (!Array.isArray(v)) badFilter('inq value must be an array');
        out.in = v;
        break;
      case 'nin':
        if (!Array.isArray(v)) badFilter('nin value must be an array');
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
      case 'between':
        if (!Array.isArray(v) || v.length < 2) badFilter('between value must be [min, max]');
        out.gte = v[0];
        out.lte = v[1];
        break;
      default:
        badFilter(\`Unsupported where operator "\${op}"\`);
    }
  }
  return out;
}
`;
}

module.exports = {
  filterToPrisma,
  mapWhere,
  mapOrder,
  mapFields,
  mapInclude,
  FilterValidationError,
  SUPPORTED_OPS,
  UNSUPPORTED_OPS,
  ALLOWED_FILTER_KEYS,
  DEFAULT_TAKE,
  MAX_TAKE,
  filterHelperSource,
};
