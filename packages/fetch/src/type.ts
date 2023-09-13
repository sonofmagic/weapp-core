export interface GetTaskOption {
  getTask?: (task: WechatMiniprogram.RequestTask, options: any) => void
}

export type UserDefinedOptions = Partial<RequestInit & WechatMiniprogram.RequestOption & GetTaskOption>

export type PlainObject = Record<string | number | symbol, any>
