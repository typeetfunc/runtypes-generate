import { Boolean, Number, String, Literal, Array, Tuple, Record, Union, Static } from '../../runtypes'
import { makeJsverifyArbitrary } from './index'
import * as _ from 'lodash';
import * as jsc from 'jsverify';

function generateAndCheck(rt) {
    return () => {
        const arbitrary = makeJsverifyArbitrary(rt)
        const sample = jsc.sampler(arbitrary)(1)[0]
        if (!rt.guard(sample)) {
            console.log(JSON.stringify(sample, null, 4))
            rt.check(sample)
        }
    };
}


describe('SpaceObject', () => {

    const Vector = Tuple(Number, Number, Number)

    const Asteroid = Record({
        type: Literal('asteroid'),
        location: Vector,
        mass: Number,
    })

    const Planet = Record({
        type: Literal('planet'),
        location: Vector,
        mass: Number,
        population: Number,
        habitable: Boolean,
    })

    const Rank = Union(
        Literal('captain'),
        Literal('first mate'),
        Literal('officer'),
        Literal('ensign'),
    )

    const CrewMember = Record({
        name: String,
        age: Number,
        rank: Rank,
        home: Planet,
    })

    const Ship = Record({
        type: Literal('ship'),
        location: Vector,
        mass: Number,
        name: String,
        crew: Array(CrewMember),
    })

    const SpaceObject = Union(Asteroid, Planet, Ship)

    test('Vector', generateAndCheck(Vector));
    test('Asteroid', generateAndCheck(Asteroid));
    test('Rank', generateAndCheck(Rank));
    test('Ship', generateAndCheck(Ship));
    test('SpaceObject', generateAndCheck(SpaceObject));
});

describe('Constraint', () => {
  const getPropFrom = (f, prop) => x => f(x)[prop];
  const positiveConstraint = (n: number) => {
    const isPos = n > 0;
    return {
      result: isPos,
      value: isPos ? n : 3
    };
  }
  test('Positive number with correction', generateAndCheck(
    Number.withConstraint(getPropFrom(positiveConstraint, 'result'), getPropFrom(positiveConstraint, 'value'))
  ));

  test('Positive number without correction', generateAndCheck(
    Number.withConstraint(getPropFrom(positiveConstraint, 'result'))
  ));
});
