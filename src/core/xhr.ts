import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'
import { isURLSameOrigin } from '../helpers/url'
import cookie from '../helpers/cookie'
import { isFormData } from '../helpers/util'


export default function xhr(config: AxiosRequestConfig): AxiosPromise {

  return new Promise((resolve, reject) => {
    const {
      data = null,
      url,
      method,
      headers = {},
      responseType,
      timeout,
      cancelToken,
      withCredentials,
      xsrfCookieName,
      xsrfHeaderName,
      onUploadProgress,
      onDownloadProgress,
      auth,
      validateStatus,
    } = config

    // 创建request实例
    const request = new XMLHttpRequest()

    // 建立http请求链接
    request.open(method!.toUpperCase(), url!, true)

    // 配置request对象
    configureRequest()

    // 添加事件处理函数
    addEvents()

    // 处理请求头信息
    processHeaders()

    // 请求取消逻辑
    processCancel()

    // 发送请求
    request.send(data)

    // 配置request
    function configureRequest(): void{
      if (responseType) {
        request.responseType = responseType
      }
      if (timeout) {
        // 如果配置了超时时间，就把参数值赋值给request
        request.timeout = timeout
      }

      if (withCredentials) {
        // console.log('withCredentials.......',withCredentials)
        request.withCredentials = withCredentials
      }
    }

    // 事件监听
    function addEvents(): void{
      // 相应状态监听函数
      request.onreadystatechange = function handleLoad() {
        /**
         * readyState 状态说明
         * 0  未初始化。表示对象已经建立，但是尚未初始化，尚未调用 open() 方法
         * 1  初始化。表示对象已经建立，尚未调用 send() 方法
         * 2  发送数据。表示 send() 方法已经调用，但是当前的状态及 HTTP 头未知
         * 3  数据传送中。已经接收部分数据，因为响应及 HTTP 头不安全，这时通过 responseBody 和 responseText 获取部分数据会出现错误
         * 4  完成。数据接收完毕，此时可以通过 responseBody 和 responseText 获取完整的响应数据
         */
        if (request.readyState !== 4) {
          return
        }

        if (request.status === 0) {
          return
        }

        const responseHeaders = parseHeaders(request.getAllResponseHeaders())
        // const responseData = responseType !== 'text' ? request.response : request.responseText
        const responseData =
          responseType && responseType !== 'text' ? request.response : request.responseText
        const response: AxiosResponse = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request
        }
        handleResponse(response)
      }

      // 请求错误
      request.onerror = function handleError() {
        reject(createError('Network Error', config, null, request))
      }

      // 请求超时
      request.ontimeout = function handleTimeout() {
        reject(createError(`Timeout of ${timeout} ms exceeded`, config, 'ECONNABORTED', request))
      }

      if(onDownloadProgress){
        request.onprogress = onDownloadProgress
      }

      if(onUploadProgress){
        request.upload.onprogress = onUploadProgress
      }

    }

    // 对请求头设置
    function processHeaders(): void{
      if(isFormData(data)){
        // 如果是上传文件，就删除 content-type属性，让浏览器自设设置该属性值
        delete headers['Content-Type']
      }

      if((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName){
        const xsrfValue = cookie.read(xsrfCookieName)
        if(xsrfValue && xsrfHeaderName){
          headers[xsrfHeaderName] = xsrfValue
        }
      }

      if(auth){
        // headers['Authorization'] =  `Basic ${btoa(`${auth.username} : ${auth.password}`)}`
        headers['Authorization'] = 'Basic ' + btoa(auth.username + ':' + auth.password)
      }

      Object.keys(headers).forEach(name => {
        if (data === null && name.toLowerCase() === 'content-type') {
          delete headers[name]
        } else {
          request.setRequestHeader(name, headers[name])
        }
      })

    }

    function processCancel(): void{
      if (cancelToken) {
        // cancelToken就是CancelToken类的实例
        cancelToken.promise.then(reason => {
          request.abort()
          reject(reason)
        }).catch(() => {
          /** istanbul ignore next */
          // do nothing
        })
      }
    }

    function handleResponse(response: AxiosResponse): void {
      if (!validateStatus || validateStatus(response.status)) {
        resolve(response)
      } else {
        reject(createError(`Request failed with status code ${response.status}`, config, null, request, response))
      }

    }
  })

}
