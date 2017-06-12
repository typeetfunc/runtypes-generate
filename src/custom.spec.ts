import { Boolean, String, Literal, Array, Record, Partial, Union, Void, Custom } from 'runtypes'
import { generateAndCheck } from './index';
import * as jsc from 'jsverify';
import { range, zip } from 'lodash'
import { makeJsverifyArbitrary, addTypeToRegistry } from './index'

function contains(list, args, eqFn, lessFn, moreFn) {
  const finded = list.filter(i => args.item.guard(i))
  const res = {
    needCount: args.count === undefined ? 1 : args.count,
    count: finded.length,
    item: args.item
  }
  if (res.needCount === res.count) {
    return eqFn(list, res)
  } else if (res.needCount > res.count) {
    return lessFn(list, res)
  } else if (res.needCount < res.count) {
    return moreFn(list, res)
  }
}

const ArrayWithContains = (arrRt, item, count) => Custom(arrRt, (list, args) => {
  const res = contains(
    list, args,
    () => true,
    (_, res) => `Array contains less than ${res.needCount} items`,
    (_, res) => `Array contains more than ${res.needCount} items`
  );

  return res;
}, contains.name, {count, item})


function generatorContains(rt: Custom<any, 'contains', any>) {
  const { underlying, args } = rt
  return makeJsverifyArbitrary(underlying).smap(coll => {
    const res = contains(
      coll, args,
      list => list,
      (list, res) => {
        const howMuch = res.needCount - res.count
        const idxs = list.length ?
          jsc.sampler(jsc.elements(range(list.length)))(howMuch) as any as number[] :
          range(howMuch)
        const elements = jsc.sampler(makeJsverifyArbitrary(res.item))(howMuch) as any[]
        zip(idxs, elements).forEach(([idx, element]) => {
          list.splice(idx, 0, element)
        });
        return list
      },
      (list, res) => {
        return list.reduce((acc, item) => {
          const isItem = res.item.guard(item)
          if (!isItem || acc.count < res.needCount) {
            acc.list.push(item)
          }
          if (isItem) {
            acc.count++
          }
          return acc;
        }, {list: [], count: 0}).list
      }
    )
    return res;
  }, x => x)
}

addTypeToRegistry(contains.name, generatorContains)

describe('FamilyObject', () => {
  const StringOrVoid = String.Or(Void)
  const Fio = Partial({
    firstname: StringOrVoid,
    lastname: StringOrVoid,
    middlename: StringOrVoid
  })
  const MemberWithRole = role => Record({
    role,
    fio: Fio
  }).And(
    Partial({
      dependant: Boolean.Or(Void)
    })
  )
  const Spouse = MemberWithRole(Literal('spouse'))
  const NotSpouse = MemberWithRole(Union(
    Literal('sibling'),
    Literal('child'),
    Literal('parent'),
    Void
  ))
  const Member = Spouse.Or(NotSpouse)
  const FamilyWithTypeAndMember = (type, countSpouse) => Record({
    type,
    members: ArrayWithContains(Array(Member), Spouse, countSpouse)
  })
  const FamilyWithSpouse = FamilyWithTypeAndMember(
    Literal('espoused'),
    1
  )
  const FamilyWithoutSpouse = FamilyWithTypeAndMember(
    Union(
      Literal('single'),
      Literal('common_law_marriage'),
      Void
    ),
    0
  )
  const membersWithSpouse = ArrayWithContains(Array(Member), Spouse, 1)
  const FamilyObject = Union(FamilyWithSpouse, FamilyWithoutSpouse)
  test('Fio', generateAndCheck(Fio))
  test('Member', generateAndCheck(Member))
  test('Member', generateAndCheck(Member))
  test('MemberWithSpouse', generateAndCheck(membersWithSpouse))
  test('FamilyWithSpouse', generateAndCheck(FamilyWithSpouse))
  test('FamilyWithoutSpouse', generateAndCheck(FamilyWithoutSpouse))
  test('FamilyObject', generateAndCheck(FamilyObject))
});

