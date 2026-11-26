export type AudioMode = 'silent' | 'select' | 'message' | 'both'

export declare const audioModeStorageKey: string
export declare const audioModeOptions: { id: AudioMode; title: string; description: string }[]
export declare function readAudioMode(storage?: Pick<Storage, 'getItem'>): AudioMode
export declare function writeAudioMode(mode: AudioMode, storage?: Pick<Storage, 'setItem'>): boolean
export declare function audioModeBehavior(mode: AudioMode): { playOnSelect: boolean; playMessage: boolean; silent: boolean }
export declare function playWithAudioFallback<T>(item: T, hasCustomAudio: boolean, playCustom: (item: T) => Promise<void>, playSpeech: (item: T) => Promise<void>): Promise<void>
export declare function playSequentially<T>(items: T[], playItem: (item: T) => Promise<void>, isCancelled: () => boolean): Promise<void>
