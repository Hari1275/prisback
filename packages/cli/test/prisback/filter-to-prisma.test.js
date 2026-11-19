'use strict';

const {expect} = require('@prisback/testlab');
const {
  filterToPrisma,
  FilterValidationError,
} = require('../../lib/prisback/filter-to-prisma');

describe('filterToPrisma (strict LB4-familiar subset)', () => {
  it('maps where, order, limit, skip', () => {
    const q = filterToPrisma({
      where: {
        name: 'Ada',
        age: {gte: 18},
        status: {inq: ['a', 'b']},
        role: {neq: 'guest'},
      },
      order: ['name ASC', 'id DESC'],
      limit: 10,
      skip: 5,
    });
    expect(q).to.eql({
      where: {
        name: 'Ada',
        age: {gte: 18},
        status: {in: ['a', 'b']},
        role: {not: 'guest'},
      },
      orderBy: [{name: 'asc'}, {id: 'desc'}],
      take: 10,
      skip: 5,
    });
  });

  it('maps and/or and between', () => {
    const q = filterToPrisma({
      where: {
        and: [{price: {between: [1, 9]}}, {or: [{tag: 'x'}, {tag: 'y'}]}],
      },
    });
    expect(q.where).to.eql({
      and: [
        {price: {gte: 1, lte: 9}},
        {or: [{tag: 'x'}, {tag: 'y'}]},
      ],
    });
    expect(q.take).to.eql(50);
  });

  it('defaults and caps limit/take', () => {
    expect(filterToPrisma({}).take).to.eql(50);
    expect(filterToPrisma({limit: 10}).take).to.eql(10);
    try {
      filterToPrisma({limit: 201});
      throw new Error('expected throw');
    } catch (err) {
      expect(err).to.be.instanceOf(FilterValidationError);
      expect(err.message).to.match(/max 200/);
    }
  });

  it('maps fields to select / omit', () => {
    expect(filterToPrisma({fields: ['id', 'name']})).to.eql({
      select: {id: true, name: true},
      take: 50,
    });
    expect(filterToPrisma({fields: {id: true, name: true}})).to.eql({
      select: {id: true, name: true},
      take: 50,
    });
    expect(filterToPrisma({fields: {password: false, secret: false}})).to.eql({
      omit: {password: true, secret: true},
      take: 50,
    });
  });

  it('maps LB4 include + scope to Prisma include', () => {
    expect(filterToPrisma({include: 'posts'})).to.eql({
      include: {posts: true},
      take: 50,
    });
    expect(filterToPrisma({include: ['posts', 'tags']})).to.eql({
      include: {posts: true, tags: true},
      take: 50,
    });
    expect(
      filterToPrisma({
        include: {
          relation: 'posts',
          scope: {where: {published: true}, limit: 5, order: ['title ASC']},
        },
      }),
    ).to.eql({
      include: {
        posts: {
          where: {published: true},
          take: 5,
          orderBy: [{title: 'asc'}],
        },
      },
      take: 50,
    });
  });

  it('rejects unsupported filter keys', () => {
    try {
      filterToPrisma({foo: 1});
      throw new Error('expected throw');
    } catch (err) {
      expect(err).to.be.instanceOf(FilterValidationError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.match(/foo/);
    }
  });

  it('rejects unsupported where operators (like/near/regexp)', () => {
    for (const [where, re] of [
      [{name: {like: '%x%'}}, /like/],
      [{loc: {near: [1, 2]}}, /near/],
      [{name: {regexp: 'a.*'}}, /regexp/],
    ]) {
      try {
        filterToPrisma({where});
        throw new Error('expected throw');
      } catch (err) {
        expect(err).to.be.instanceOf(FilterValidationError);
        expect(err.statusCode).to.equal(400);
        expect(err.message).to.match(re);
      }
    }
  });

  it('allows Prisma string filters contains/startsWith/endsWith', () => {
    const q = filterToPrisma({
      where: {
        name: {contains: 'Ada'},
        email: {startsWith: 'a'},
        path: {endsWith: '.ts'},
      },
    });
    expect(q.where).to.eql({
      name: {contains: 'Ada'},
      email: {startsWith: 'a'},
      path: {endsWith: '.ts'},
    });
    expect(q.take).to.eql(50);
  });
});
