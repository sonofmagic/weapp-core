/* eslint-disable no-useless-escape */
import { wxsTagRegexp, matchAll } from '@/index'

describe('wxs', () => {
  it('inline wxs', () => {
    const arr = matchAll(
      wxsTagRegexp,
      `<wxs module="inline">

    var className = 'after:content-[\'我来自inline-wxs\']'
    module.exports = {
      className: className
    }
  
  </wxs>
  <wxs module="outside">
  /* eslint-disable */
  
  
  var className = 'after:content-[\'我来自outside-wxs\']'
  module.exports = {
    className: className
  }
  </wxs>
  <view class="beforeccontent-_qmoduleA_u72ecu7acbu5206u5305q_">
    <view class="{{inline.className}}"></view>
    <view class="{{outside.className}}"></view>
  </view>`
    )

    expect(arr.length).toBe(2)
  })

  it('import wxs', () => {
    const arr = matchAll(
      wxsTagRegexp,
      `<wxs module="inline">

      var className = 'after:content-[\'我来自inline-wxs\']'
      module.exports = {
        className: className
      }
    
    </wxs>
    <wxs src="./index.wxs" module="outside"/>
    <view class="beforeccontent-_qmoduleA_u72ecu7acbu5206u5305q_"><view class="{{inline.className}}"></view><view class="{{outside.className}}"></view></view>`
    )
    // 只匹配有闭合标签的
    expect(arr.length).toBe(1)
  })
})
