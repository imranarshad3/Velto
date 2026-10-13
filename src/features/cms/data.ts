import type { ContentField } from './types.js'
const keys = new Set(['name','label','title','text','caption','description','intro','to','href','q','a','src','alt'])
/** Only editorial leaves are editable; identifiers, icons and category relationships stay fixed. */
export function mapContentData<T>(data: T, prefix: string, transform: (key: string, value: string, kind: ContentField['kind']) => string): T {
  const visit = (v: unknown, path: string, name: string): unknown => {
    if (typeof v === 'string' && (keys.has(name) || /^\d+$/.test(name))) return transform(path,v,name==='src'?'image':name==='to'||name==='href'?'link':'text')
    if (Array.isArray(v)) return name==='categories' ? v : v.map((x,i)=>visit(x,`${path}.${i}`,String(i)))
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype && !('$$typeof' in v)) return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,visit(x,`${path}.${k}`,k)]))
    return v
  }
  return visit(data,prefix,'') as T
}
export function dataFields(data: unknown, prefix: string): ContentField[] {
  const fields: ContentField[]=[]
  mapContentData(data,prefix,(key,value,kind)=>{fields.push({key,label:`${key.split('.').slice(-2).join(' · ')}: ${value.slice(0,45)}`,value,kind});return value})
  return fields
}
