import {
  variableRegExp,
  createTemplateHandlerMatchRegexp,
  createTemplateClassRegexp,
  escapeStringRegexp,
  getSourceString,
  matchAll,
  tagWithEitherClassAndHoverClassRegexp,
  templateClassExactRegexp
} from '@/index'

describe('regexp', () => {
  test('with var 5', () => {
    const case3 = "{{ utils.bem('button', [type, size, { block, round, plain, square, loading, disabled, hairline, unclickable: disabled || loading }]) }}"
    const arr = matchAll(variableRegExp, case3)

    expect(arr.length).toBe(1)
  })

  test('with var 6', () => {
    const case3 = `{{[
      'flex',
      'items-center',
      'justify-center',
      'h-_l_100px_r_',
      'w-_l_100px_r_',
      'rounded-_l_40px_r_',
      'bg-_l__h_123456_r_',
      'bg-opacity-_l_0-dot-54_r_',
      'text-_l__h_ffffff_r_',
      'data-v-1badc801',
      'text-_l__h_123456_r_',
      b]}}`
    const arr = matchAll(variableRegExp, case3)
    expect(arr.length).toBe(1)
  })

  test('customAttributes case 0', () => {
    const attrs = ['image-class', 'loading-class', 'error-class', 'custom-class']
    const regexp = createTemplateHandlerMatchRegexp('van-image', attrs)
    const testCase = '<van-image class="w-[0.5px]" custom-class="w-[0.5px]" image-class="w-[0.5px]" other-attr="w-[0.5px]"></van-image>'
    const matches = [...testCase.matchAll(regexp)]
    expect(matches.length > 0).toBe(true)
    const regexp0 = createTemplateClassRegexp(attrs)
    const matches0 = [...testCase.matchAll(regexp0)]
    expect(matches0.length === 2).toBe(true)
    for (const match of matches0) {
      expect(match[1]).toBe('w-[0.5px]')
    }
  })

  it('escapeStringRegexp throw error', () => {
    expect(() => {
      // @ts-ignore
      escapeStringRegexp({})
    }).toThrow()
  })

  it('getSourceString case0', () => {
    let input: any = 'a'
    expect(getSourceString(input)).toBe(input)
    input = /\s\w\b$/
    expect(getSourceString(input)).toBe(input.source)
    input = {}
    expect(getSourceString(input)).toBe(Object.prototype.toString.call(input))
  })

  it('tagWithEitherClassAndHoverClassRegexp case 0', () => {
    const res = matchAll(
      tagWithEitherClassAndHoverClassRegexp,
      `<view wx:if="{{xxx}}" class="ml-[16px]"><view class="ml-[16px]" wx:if="{{xxx}}"></view>
      <view></view>


      <text hover-class="m-[6px]" class="ml-[13px]"></text></view>`
    )
    expect(res.length).toBe(3)
    expect(res[0][0]).toBe('<view wx:if="{{xxx}}" class="ml-[16px]">')
    expect(res[1][0]).toBe('<view class="ml-[16px]" wx:if="{{xxx}}">')
    expect(res[2][0]).toBe('<text hover-class="m-[6px]" class="ml-[13px]">')
    const classTokens: RegExpExecArray[][] = []
    for (const re of res) {
      classTokens.push(matchAll(templateClassExactRegexp, re[0]))
    }
    expect(classTokens.length).toBe(3)
    expect(classTokens[0].length).toBe(1)
    expect(classTokens[1].length).toBe(1)
    expect(classTokens[2].length).toBe(2)
  })
})
