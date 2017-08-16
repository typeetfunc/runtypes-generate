import * as jsc from 'jsverify';
import { Reflect } from 'runtypes';
import { flatten, every, some, find } from 'lodash';

declare module 'jsverify' {
  function record<T>(spec: { [s: string]: T }): jsc.Arbitrary<T>;
  function oneof<T>(gs: jsc.Arbitrary<T>[]): jsc.Arbitrary<T>;
}

function identity(x: any) {
  return x;
}

function guardEvery(rts, x) {
  return every(rts, rt => (rt as any).guard(x))
}

function findIntersectInRegistry(intersectees, registry, getTag) {
  return registry.reduce(
    (acc, [setTags, func]) => {
      if (every(intersectees, intersect => setTags.has(getTag(intersect)))){
        return func;
      }
      return acc;
    },
    null
  );
}

function defaultIntersectHandle({ intersectees }) {
  const allIntersectees = jsc.tuple(
    intersectees.map(intersect => makeJsverifyArbitrary(intersect))
  );

  return jsc.suchthat(
    allIntersectees,
    tuple => some(tuple, x => guardEvery(intersectees, x))
  )
  .smap(
    tuple => find(tuple, x => guardEvery(intersectees, x)),
    identity
  );
}

const CUSTOM_REGISTRY = {};
const CUSTOM_INTERSECT_REGISTRY: any[] = [];
const INTERSECT_REGISTRY = [
  [new Set(['partial', 'record']), ({ intersectees }) => jsc.tuple(intersectees.map(intersect => makeJsverifyArbitrary(intersect)))
    .smap(tupleOfTypes => tupleOfTypes.reduce(
      (acc, item) => Object.assign(acc, item)
    ), identity)
  ],
  [new Set(['union']),  ({ intersectees }) => {
    const alternatives = flatten(
      intersectees.map(intersect => intersect.alternatives)
    )
    const allAltArb = jsc.tuple(alternatives.map(makeJsverifyArbitrary))

    return jsc.bless({
      ...allAltArb,
      generator: allAltArb.generator.flatmap(tuple => {
        const onlyIntersectees = tuple.filter(
          x => guardEvery(intersectees, x)
        )

        return jsc.elements(onlyIntersectees).generator;
      })
    })
  }],
  [new Set(['constraint']), ({ intersectees }) => {
    const handler = findIntersectInRegistry(
      intersectees,
      CUSTOM_INTERSECT_REGISTRY,
      x => x.args && x.args.tag
    ) || defaultIntersectHandle;

    return handler({ intersectees })
  }]
];


const REGISTRY = {
    always: () => jsc.json,
    array: ({ element }) => jsc.array(makeJsverifyArbitrary(element)),
    boolean: () => jsc.bool,
    constraint: ({ constraint, underlying, args }) => {
      if (args) {
        if (CUSTOM_REGISTRY[args.tag]) {
          return CUSTOM_REGISTRY[args.tag]({ constraint, underlying, args });
        } else {
          throw new Error(`Please add generator for ${args.tag} with addTypeToRegistry`);
        }
      } else {
        return jsc.suchthat(makeJsverifyArbitrary(underlying), constraint)
      }
    },
    dictionary: ({ value }) => jsc.dict(makeJsverifyArbitrary(value)),
    function: () => jsc.fn(jsc.json),
    intersect: ({ intersectees }) => {
      const handler = findIntersectInRegistry(
        intersectees,
        INTERSECT_REGISTRY,
        x => x.tag
      ) || defaultIntersectHandle;

      return handler({ intersectees });
    },
    literal: ({ value }) => jsc.constant(value),
    number: () => jsc.number,
    partial: ({ fields }) => {
      var spec = {};
      Object.keys(fields).forEach(fieldName => {
        spec[fieldName] = jsc.oneof([
          makeJsverifyArbitrary(fields[fieldName]),
          jsc.constant(undefined)
        ])
      });
      return jsc.record(spec)
        .smap(rec => {
          const recWithoutEmpty = {...rec};
          Object.keys(recWithoutEmpty).forEach(key => {
            if (recWithoutEmpty[key] === undefined) {
              delete recWithoutEmpty[key];
            }
          })
          return recWithoutEmpty;
        }, identity);
    },
    record: ({ fields }) => {
      var spec = {};
      Object.keys(fields).forEach(fieldName => {
        spec[fieldName] = makeJsverifyArbitrary(fields[fieldName]);
      });
      return jsc.record(spec);
    },
    string: () => jsc.string,
    tuple: ({ components }) => jsc.tuple(components.map(component => makeJsverifyArbitrary(component))),
    union: ({ alternatives }) => jsc.oneof(alternatives.map(alternative => makeJsverifyArbitrary(alternative))),
    void: () => jsc.elements([null, undefined])
};

export function makeJsverifyArbitrary<T extends Reflect>(type: T): jsc.Arbitrary<any> {
    if (type.tag && REGISTRY.hasOwnProperty(type.tag)) {
        return REGISTRY[type.tag](type);
    }
    throw new Error('Can not generate this type');
}

export function addTypeToRegistry<T extends Reflect>(tag: string, generator: (x: T) => jsc.Arbitrary<any>): void {
  CUSTOM_REGISTRY[tag] = generator;
}

export function addTypeToIntersectRegistry<T extends Reflect>(tags: string[], generator: (x: T) => jsc.Arbitrary<any>): void {
  CUSTOM_INTERSECT_REGISTRY.push([
    new Set(tags), generator
  ]);
}

export function generateAndCheck<T extends Reflect>(rt: T, opts?: jsc.Options) {
  return () => {
    const arbitrary = makeJsverifyArbitrary(rt)
    jsc.assert(jsc.forall(arbitrary, function arbitraryIsChecked(anything) {
      rt.check(anything)
      return true;
    }), opts)
  };
}
