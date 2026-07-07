import { zh, en } from './dict-data'
export type Lang = 'zh' | 'en'
export type Locale = Lang
export type DictKey = keyof typeof zh

export const dictionaries = { zh, en } as const
