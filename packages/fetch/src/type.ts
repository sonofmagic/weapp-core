export interface GetTaskOption {
  getTask?: (task: WechatMiniprogram.RequestTask, options: any) => void
}

export type UserDefinedOptions = Partial<RequestInit & WechatMiniprogram.RequestOption & GetTaskOption>

export type PlainObject = Record<string | number | symbol, any>

// export interface IDOMException extends Error {
//   constructor(message?: string, name?: string): void
// }
export type IHeaders = Headers

export type IRequest = Request

export type IResponse = Response
