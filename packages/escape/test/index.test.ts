import { MappingChars2String, MappingChars2StringEntries, SimpleMappingChars2String, SimpleMappingChars2StringEntries, isAsciiNumber, escape } from '@/index'

const testCase = `1234567890-=\b~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;'ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?`
describe('index', () => {
  it('map count eq', () => {
    expect(MappingChars2StringEntries.length).toBe(SimpleMappingChars2StringEntries.length)
    expect(Object.keys(MappingChars2String).sort()).toEqual(Object.keys(SimpleMappingChars2String).sort())
  })

  it('isAsciiNumber', () => {
    for (const char of '1234567890') {
      const num = char.codePointAt(0)
      if (num) {
        const res = isAsciiNumber(num)
        // if (!res) {
        //   console.log(char)
        // }
        expect(res).toBe(true)
      }
    }
  })

  it('not AsciiNumber', () => {
    for (const char of "qwertyuiop[]asdfghjkl;'zxcvbnm,./=-") {
      const num = char.codePointAt(0)
      if (num) {
        const res = isAsciiNumber(num)

        expect(res).toBe(false)
      }
    }
  })

  it('escape', () => {
    const res = escape(testCase)
    expect(res).toMatchSnapshot()
  })

  it('escape with map', () => {
    const res = escape(testCase, { map: MappingChars2String })
    expect(res).toMatchSnapshot()
  })
})
