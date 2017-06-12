import * as jsc from 'jsverify';

function identity(x: any) {
    return x;
}

const REGISTRY = {
    always: () => jsc.json,
    array: ({ element }) => jsc.array(makeJsverifyArbitrary(element)),
    boolean: () => jsc.bool,
    constraint: ({ constraint, underlying }) => jsc.suchthat(makeJsverifyArbitrary(underlying), constraint),
    dictionary: ({ value }) => jsc.dict(makeJsverifyArbitrary(value)),
    function: () => jsc.fn(jsc.json),
    intersect: ({ intersectees }) => jsc.tuple(intersectees.map(intersect => makeJsverifyArbitrary(intersect)))
    .smap(tupleOfTypes => tupleOfTypes.reduce(
      (acc, item) => Object.assign(acc, item)
    ), identity),
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

export function makeJsverifyArbitrary(type) {
    if (type.tag && REGISTRY.hasOwnProperty(type.tag)) {
        return REGISTRY[type.tag](type);
    }
    throw new Error('Can not generate this type');
}

export function addTypeToRegistry(tag, generator) {
  REGISTRY[tag] = generator;
}

export function generateAndCheck(rt, opts?: jsc.Options) {
  return () => {
    const arbitrary = makeJsverifyArbitrary(rt)
    jsc.assert(jsc.forall(arbitrary, function arbitraryIsChecked(anything) {
      rt.check(anything)
      return true;
    }), opts)
  };
}
