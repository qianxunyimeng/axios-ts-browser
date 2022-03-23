import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from '../types'
import xhr from './xhr'
import { buildURL, combineURL, isAbsoluteURL } from '../helpers/url'
// import { transformRequest, transformResponse } from '../helpers/data'
import { flattenHeaders } from '../helpers/headers'
import { transform } from './transform'

export default function dispatchRequest(config: AxiosRequestConfig): AxiosPromise {
  // 发送请求前检测是否使用过canceltoken,如果使用过就不会发送请求
  throwIfCancellationRequested(config)
  // 发送之前对配置参数进行处理
  processConfig(config)
  // 发送请求
  return xhr(config).then((res) => {
    return transformResponseData(res)
  },e => {
    if(e && e.response){
      e.response = transformResponseData(e.response)
    }
    return Promise.reject(e)
  })
}

function processConfig(config: AxiosRequestConfig): void {
  config.url = transformURL(config)
  // 注意 这里一定要先处理headers,因为transformRequestData会把data转为json字符串
  // config.headers = transformHeaders(config)
  // config.data = transformRequestData(config)
  config.data = transform(config.data,config.headers,config.transformRequest)
  config.headers = flattenHeaders(config.headers,config.method!)

}


/**
 * 对URL参数进行处理
 * @param config
 */
export function transformURL(config: AxiosRequestConfig): string {
  let { url, params,paramsSerializer,baseURL} = config
  if(baseURL && !isAbsoluteURL(url!)){
    // console.log('绝对地址，地址合并')
    url = combineURL(baseURL,url)
    // console.log('合并后地址:',url)
  }
  return buildURL(url!, params,paramsSerializer)
}

// function transformRequestData(config: AxiosRequestConfig): any {
//   return transformRequest(config.data)
// }
//
// function transformHeaders(config: AxiosRequestConfig):any{
//   // 如果用户没有配置headers，这里就默认初识为一个空对象{}
//   const {headers = {},data} = config
//   return processHeaders(headers,data)
// }

/**
 * 试图将返回对结果转为json对象
 * @param res
 */
function transformResponseData(res: AxiosResponse): AxiosResponse{
  // res.data = transformResponse(res.data)
  res.data = transform(res.data,res.headers,res.config.transformResponse)
  return res
}

function throwIfCancellationRequested(config: AxiosRequestConfig): void{
  if(config.cancelToken){
    config.cancelToken.throwIfRequested()
  }
}

