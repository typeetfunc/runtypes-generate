import { Boolean, Number, String, Literal, Array, Tuple, Record, Union } from '../../runtypes'
import { generateAndCheck } from './index';

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

/*describe('Constraint', () => {
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
}); */
