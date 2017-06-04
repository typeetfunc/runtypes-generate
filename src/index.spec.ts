import { Boolean, Number, String, Literal, Array, Tuple, Record, Partial, Union, Void } from 'runtypes'
import { makeJsverifyArbitrary } from './index'
import * as _ from 'lodash';
import * as jsc from 'jsverify';


const getPropFrom = (f, prop) => x => f(x)[prop];

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

describe('FamilyObject', () => {
  const Type = Union(
    Literal('espoused'),
    Literal('single'),
    Literal('common_law_marriage'),
    Void
  )
  const Role = Union(
    Literal('sibling'),
    Literal('child'),
    Literal('parent'),
    Literal('spouse'),
    Void
  )
  const StringOrVoid = String.Or(Void)
  const Fio = Partial({
    firstname: StringOrVoid,
    lastname: StringOrVoid,
    middlename: StringOrVoid
  })
  const Member = Record({
    role: Role,
    fio: Fio
  }).And(
    Partial({
      dependant: Boolean.Or(Void)
    })
  )

  const checkFamily = familyObject => {
    // find all spouse
    var spouse = familyObject.members.filter(member => member.role === 'spouse');
    if (familyObject.type === 'espoused' && spouse.length === 0) {
      const value = {
        type: familyObject.type,
        members: [
          { role: 'spouse', fio: {} }, // add spouse
          ...familyObject.members
        ]
      }
      return {
        result: 'Espoused but has not spouse',
        value
      };
    } else if (familyObject.type !== 'espoused' && spouse.length !== 0) {
      const value = {
        type: familyObject.type,
        // drop spouse from family
        members: familyObject.members.filter(member => member.role !== 'spouse')
      }
      return {
        result: 'Not espoused but has spouse',
        value
      }
    } else if (spouse.length > 1) {
      const value = {
        type: familyObject.type,
        members: familyObject.members.reduce((acc, member) => {
          if (member.role !== 'spouse' && acc.hasSpouse) {
            acc.members.push(member);
          } else if (member.role === 'spouse' && !acc.hasSpouse) {
            acc.members.push(member);
            acc.hasSpouse = true;
          }
          return acc;
        }, { members: [], hasSpouse: false }).members
      }
      return {
        result: 'Has more than 1 spouse',
        value
      }
    }

    return {
      result: true,
      value: familyObject
    }
  }
  const FamilyObject = Record({
    type: Type,
    members: Array(Member)
  })
  const FamilyObjectWithConstraint = FamilyObject.withConstraint(
    getPropFrom(checkFamily, 'result'),
    getPropFrom(checkFamily, 'value')
  )
  test('Fio', generateAndCheck(Fio))
  test('Member', generateAndCheck(Member))
  test('FamilyObject', generateAndCheck(FamilyObject))
  test('FamilyObjectWithConstraint', generateAndCheck(FamilyObjectWithConstraint))
});
