export type ItemOrItemArray<T> = T | T[]

export type ICustomRegexp = {
  tagRegexp: RegExp
  attrRegexp: RegExp
  tag: string
  attrs: ItemOrItemArray<string | RegExp>
}

export interface ICreateRegexpOptions {
  exact?: boolean
}
