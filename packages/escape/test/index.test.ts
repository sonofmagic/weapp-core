import { MappingChars2String, MappingChars2StringEntries, SimpleMappingChars2String, SimpleMappingChars2StringEntries, escape, isAsciiNumber } from '@/index'

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
    for (const char of 'qwertyuiop[]asdfghjkl;\'zxcvbnm,./=-') {
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

  it('mAX_ASCII_CHAR_CODE', () => {
    const res = escape('我爱你')
    expect(res).toBe('u6211u7231u4f60')
  })

  it('-', () => {
    const res = escape('-')
    expect(res).toBe('_-')
  })

  it('- ignoreHead', () => {
    const res = escape('-', { ignoreHead: true })
    expect(res).toBe('-')
  })

  it('-number', () => {
    const res = escape('-12345')
    expect(res).toBe('_-12345')
  })

  it('-number ignoreHead', () => {
    const res = escape('-12345', { ignoreHead: true })
    expect(res).toBe('-12345')
  })

  it('-string', () => {
    const res = escape('-plmkoi')
    expect(res).toBe('-plmkoi')
  })

  it('-string ignoreHead', () => {
    const res = escape('-plmkoi', { ignoreHead: true })
    expect(res).toBe('-plmkoi')
  })

  it('-string 0', () => {
    const res = escape('-aplmkoi')
    expect(res).toBe('-aplmkoi')
  })

  it('-string 0 ignoreHead', () => {
    const res = escape('-aplmkoi', { ignoreHead: true })
    expect(res).toBe('-aplmkoi')
  })
})
