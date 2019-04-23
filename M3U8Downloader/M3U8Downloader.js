/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import M3U8DownloaderConfig from "./M3U8DownloaderConfig";

// 对加密ts合成mp4
// ffmpeg -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i index.m3u8 -c copy out.mp4

export default class M3U8Downloader {

    constructor() {

    }

    /**
     *
     * @param downloadConfig {
     *                          m3u8Url:string,
     *                          filePath:string,
     *                          segment?:number,
     *                          onStartReady?:fun,
     *                          onStartDownload?:fun,
     *                          onEndDownload?:fun,
     *                          onError?:fun,
     *                          onProgress?:fun,
     *                          _resume?:bool,
     *
     *                        }
     */

    downloadM3U8File = downloadConfig =>{
        let {m3u8Url,filePath,segment,onStartReady,onStartDownload,onEndDownload,onError,onProgress,resume} = downloadConfig;
        if(!m3u8Url){
            if(onError){
                onError('m3u8Url is undefined')
            }
            return;
        }
        if(!filePath){
            if(onError){
                onError('filePath is error')
            }
            return;
        }
        if(onStartReady){
            onStartReady(true)
        }
        if(!segment || segment <= 0 || segment > 5){
            segment = 3
        }
        let last = filePath.lastIndexOf('/');
        let savePath = filePath.substring(0,last);
        let fileName = filePath.substring(last+1,filePath.length);
        let split = fileName.split('.');
        fileName = split[0];
        this._downloadConfig  = new M3U8DownloaderConfig();
        if(typeof resume === 'boolean' && resume){
            this._downloadConfig.resume(savePath,m3u8Url,fileName,segment,onStartDownload,onEndDownload,onProgress,onError);
            return;
        }
        this._downloadConfig.downloadM3U8File(savePath,m3u8Url,fileName,segment,onStartDownload,onEndDownload,onProgress,onError);
    }

    pause = ()=>{
        this._downloadConfig.onPause();
    }

    start = () =>{
        this._downloadConfig.onStart();
    }

    clear = (filePath) =>{

    }

}
