declare namespace IMusic {
    export interface IMusicSheetItemBase {
        /** 封面图 */
        coverImg?: string;
        artwork?: string;
        /** 标题 */
        title?: string;
        /** 作者 */
        artist?: string;
        /** 歌单id */
        id: string;
        /** 描述 */
        description?: string;
        /** 作品总数 */
        worksNum?: number;
        /** 歌单专属背景图（本地歌单） */
        background?: string;
        /** 歌单专属背景的模糊度 */
        backgroundBlur?: number;
        /** 歌单专属背景的不透明度 */
        backgroundOpacity?: number;
        platform: string;
        [k: string]: any;
    }
    /** 歌单项 */
    export interface IMusicSheetItem extends IMusicSheetItemBase {
        musicList: Array<IMusic.IMusicItem>;
        /** 是否为导入接口返回的完整歌单快照 */
        isImported?: boolean;
    }

    export type IMusicSheet = Array<IMusicSheetItem>;
}
