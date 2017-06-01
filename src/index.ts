import * as jsc from 'jsverify';

const identity = (x: any) => x;

const types = {
    always: () => jsc.json,
    array: ({ element }) => jsc.array(makeJsverifyArbitrary(element)),
    boolean: () => jsc.bool, 
    constraint: ({ constraint, correction, underlying, rightInverse = identity }) => correction ?
        makeJsverifyArbitrary(underlying).smap(correction, rightInverse) :
        jsc.suchthat(makeJsverifyArbitrary(underlying), constraint),
    dictionary: ({ value }) => jsc.dict(makeJsverifyArbitrary(value)),
    function: () => jsc.fn(),
    intersect: ({ intersectees }) => jsc.oneof(...intersectees.map(intersect => makeJsverifyArbitrary(intersect))),
    literal: ({ value }) => jsc.constant(value), 
    number: () => jsc.number,
    record: ({ fields }) => {
        var spec = {};
        Object.keys(fields).forEach(fieldName => {
            spec[fieldName] = makeJsverifyArbitrary(fields[fieldName]);
        });
        return spec;
    },
    string: () => jsc.string,
    tuple: ({ components }) => jsc.tuple(components.map(component => makeJsverifyArbitrary(component))),
    union: ({ alternatives }) => jsc.sum(alternatives.map(alternative => makeJsverifyArbitrary(alternative))),
    void: () => jsc.elements([null, undefined])
};


export function makeJsverifyArbitrary(type) {
    if (type.tag && types.hasOwnProperty(type.tag)) {
        return types[type.tag](type);
    }
    throw new Error('Can not generate this type');
}

