# Runtypes-generate

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

`Runtypes-generate` convert [`runtypes` type](https://github.com/pelotom/runtypes) to [jsverify arbitrary](https://github.com/jsverify/jsverify.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Background

Property-based testing is very awesome approach for analyze and verification program. But this approach requires the writing of generators for all datatypes in our program. This process is very time-consuming, error-prone and not DRY.

Example:

```js
import { Number, Literal, Array, Tuple, Record } from 'runtypes'
const AsteroidType = Record({
    type: Literal('asteroid'),
    location: Tuple(Number, Number, Number),
    mass: Number,
})

const AsteroidArbitrary = jsc.record({
    type: jsc.constant('asteroid'),
    location: jsc.tuple(jsc.number, jsc.number, jsc.number),
    mass: jsc.number
})
```

But with `runtypes-generate` we can get `AsteroidArbitrary` from `AsteroidType`:

```js
import { makeJsverifyArbitrary } from 'runtypes-generate'
const AsteroidType = Record({
    type: Literal('asteroid'),
    location: Tuple(Number, Number, Number),
    mass: Number,
})
const AsteroidArbitrary = makeJsverifyArbitrary(AsteroidType)
```

## Install

```
npm install --save runtypes-generate
```

## Usage

- [Core runtypes](https://github.com/typeetfunc/runtypes-generate/blob/master/src/index.spec.ts)
- [Custom runtypes](https://github.com/typeetfunc/runtypes-generate/blob/master/src/custom.spec.ts)

## API

- `makeJsverifyArbitrary(type: Reflect): jsc.Arbitrary<any>` - convert `runtypes` to `jsverify` arbitrary
- `addTypeToRegistry(tag: string, (x:Reflect) => jsc.Arbitrary<any>): void` - add new generator for [`Constraint` type](https://github.com/pelotom/runtypes#constraint-checking) with [`tag` in `args` attribute](https://github.com/typeetfunc/runtypes-generate/blob/master/src/custom.spec.ts#L23-L32)
- `addTypeToIntersectRegistry(tags: string[], generator: (x: Reflect) => jsc.Arbitrary<any>): void)`  - add new generator for `Intersect` or custom `Constraint` types. TODO example
- `generateAndCheck(rt: Reflect, opts?: jsc.Options): () => void` - run `jsc.assert` for property `rt.check(generatedData)` for all `generatedData` obtained from `makeJsverifyArbitrary(rt)`. Uses for verification custom generators for custom `Constraint` type. See [example](https://github.com/typeetfunc/runtypes-generate/blob/master/src/custom.spec.ts#L112-L118) in tests. 

## Contribute

PRs accepted.

If you had questions just make issue or ask them in [my telegram](https://telegram.me/bracketsarrows)

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

MIT © typeetfunc