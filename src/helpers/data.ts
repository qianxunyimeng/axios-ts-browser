import { isPlainObject } from './util'

/**
 *  请求data准换
 * @param data
 */
export function transformRequest(data: any): any {
    /**
     * XMLHttpRequest.send(body)
     * 支持Blob, BufferSource (en-US), FormData, URLSearchParams, 或者 USVString对象
     */
  if (isPlainObject(data)) {
    // 所以需要把普通对象类型对参数转为json字符串
    return JSON.stringify(data)
  }
  return data
}

export function transformResponse(data: any): any {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (err) {
      // do nothing
    }
  }
  return data
}
