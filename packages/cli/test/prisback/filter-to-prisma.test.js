'use strict';

const {expect} = require('@prisback/testlab');
const {filterToPrisma} = require('../../lib/prisback/filter-to-prisma');

describe('filterToPrisma (LB4-style → Prisma)', () => {
  it('maps where shorthand, operators, order, limit, skip', () => {
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
  });
});
