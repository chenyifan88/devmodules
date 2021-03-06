/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import {
    AsyncStorage,
} from 'react-native';

import {
    Parser
} from 'm3u8-parser'
import axios from 'axios'
import {
    mkdir,
    exists,
    writeFile,
    readFile,
    downloadFile,
    unlink,
} from 'react-native-fs';

export default class M3U8DownloaderConfig {

    constructor() {
        this._segment = 0; // 分几段下载
        this._downloadedSegment = 0; // 完成几个分段下载
        // 注： 这里的下载是指下一个ts分片的下载
        this._onPause = false; // 暂停下载，暂停下载
        this._onStart = true; // 开始下载，调用onPause后，可以在调用onStart开始下载
        this._onResume = false; // 恢复下载，针对非人为中断下载
        this._onCancel =false; // 取消下载，会清空所有下载文件

        this._timeout = 30000;
    }

    /**
     * 暂停下载
     */
    onPause = ()=>{
        if(this._onCancel){
            this._getOnError()&&this._getOnError()("文件已经取消下载");
            return
        }
        if(!this._onPause){
            this._setBool(false,true,false,false)
        }

    }
    /**
     * 取消下载，会清空下载的目录
     * @param savePath
     * @returns {boolean}
     */
    onCancel = (savePath) =>{
        let result = false;
        try{
            if(!this._onCancel){
                this._setBool(false,false,false,true);
                unlink(savePath).then().catch();
                this._setDownloadCount(0);
                this._setDownloadedCount(0);
                this._setSegment(0);
                result =  true;
            }
        }catch (e) {
            return false;
        }
        return result;

    }
    /**
     * 暂停过后，点击开始下载，不适合用于异常中断或者程序退出 ----------- 废弃 --------
     * @returns {Promise<void>}
     */
    onStart =async () =>{
        if(!this._onStart){
            this._setBool(true,false,false,false)
            this._continueDownload();
        }
    }
    /**
     * 恢复下载， 点击onPause后可以通过它恢复下载，获取下载异常中断，也可通过它恢复
     * @param savePath
     * @param m3u8Url
     * @param fileName
     * @param segment
     * @param onStartDownload
     * @param onEndDownload
     * @param onProgress
     * @param onError
     * @returns {Promise<void>}
     */
    onResume = async (savePath, m3u8Url, fileName, segment, onStartDownload, onEndDownload, onProgress, onError) =>{
        try{
            if(!this._onResume){
                this._setBool(false,false,true,false)

                let filePath = savePath+'/'+fileName+'.m3u8';
                let isExist = await exists(filePath);
                if(isExist){
                    this._init(savePath,fileName,segment,onStartDownload,onEndDownload,onProgress,onError);
                    // 恢复下载时，需要读取存储到本地的下载id
                    let downloadID = await readFile(this._getDownloadIdFilePath());
                    this._setCurrentDownloadId(downloadID)
                    this._continueDownload();
                }else{
                    this.downloadM3U8File(savePath,m3u8Url,fileName,segment,onStartDownload,onEndDownload,onProgress,onError)
                }
            }
        }catch (e) {
            onError && onError(e);
        }
    }
    // 继续下载
    /**
     * 继续下载
     * @returns {Promise<void>}
     * @private
     */
    _continueDownload = async ()=>{
        try{
            this._getOnStartDownload() && this._getOnStartDownload()(true);
            let isDownloaded = this._isDownloaded();
            if(isDownloaded){
                this._getOnEndDownload() && this._getOnEndDownload()(true)
                return;
            }
            let data = await AsyncStorage.getItem(this._getTsUrlsStorageKey());
            let objData = JSON.parse(data);
            let downloadSegment = this._getSegment();
            let downloadCount = objData.length;
            this._setDownloadCount(downloadCount);
            let segmentCount = Math.floor(downloadCount/downloadSegment);
            let downloadedCount = 0;
            for(let i = 1;i <= downloadSegment;i++){
                let currentSegmentStorageKey = this._getCurrentSegmentStorageKey(i);
                let startIndex= segmentCount*(i-1);;
                let endIndex = segmentCount*i;
                if(i === downloadSegment){
                    endIndex = downloadedCount;
                }
                let startIndex_endIndex =await AsyncStorage.getItem(currentSegmentStorageKey);
                if(startIndex_endIndex){
                    let split = startIndex_endIndex.split('_');
                    startIndex = parseInt(split[0]);
                    endIndex = parseInt(split[1]);
                }
                console.warn("startIndex:"+startIndex+" endIndex:"+endIndex);
                let curSegmentDownloadedCount = startIndex - segmentCount*(i-1);
                downloadedCount+=curSegmentDownloadedCount;
                this._setDownloadedCount(downloadedCount);
                this._downloadTsFile(objData,startIndex,endIndex,i)
            }
        }catch (e) {
            this._getOnError() && this._getOnError()(e);
        }
    }
    /**
     *
     * @param start
     * @param pause
     * @param resume
     * @param cancel
     * @private
     */
    _setBool = (start,pause,resume,cancel)=>{
        this._onStart = start;
        this._onPause = pause;
        this._onResume = resume;
        this._onCancel = cancel;

    }
    /**
     * 设置数据的保存路径
     * @param savePath
     * @private
     */
    _setSavePath = savePath =>{
        this._savePath = savePath;
    }

    _getSavePath = () => {
        return this._savePath;
    }
    /**
     * 设置开始下载的回调
     * @param onStartDownload
     * @private
     */
    _setOnStartDownload = onStartDownload=>{
        this._onStartDownload = onStartDownload;
    }

    _getOnStartDownload = () =>{
        if(typeof this._onStartDownload !== 'function'){
            this._onStartDownload = undefined;
        }
        return this._onStartDownload;
    }

    /**
     * 设置下载进度的回调
     * @param onProgress
     * @private
     */
    _setOnProgress = onProgress =>{
        this._onProgress = onProgress;
    }

    _getOnProgress = () => {
        if(typeof this._onProgress !== 'function'){
            this._onProgress = undefined;
        }
        return this._onProgress;
    }
    // 设置错误的索引
    /**
     * 设置下载错误的回调
     * @param onError
     * @private
     */
    _setOnError= onError =>{
        this._onError = onError;
    }

    _getOnError = () => {
        if(typeof this._onError !== 'function'){
            this._onError = undefined;
        }
        return this._onError;
    }
    // 设置下载完成索引
    /**
     * 设置下载完成的回调
     * @param onEndDownload
     * @private
     */
    _setOnEndDownload = onEndDownload =>{
        this._onEndDownload = onEndDownload;
    }

    _getOnEndDownload = () =>{
        if(typeof this._onEndDownload !== 'function'){
            this._onEndDownload = undefined;
        }
        return this._onEndDownload;
    }
    /**
     * 设置下载的文件名
     * @param fileName
     * @private
     */
    _setFileName = fileName =>{
        this._fileName = fileName;
    }

    _getFileName = () =>{
        return this._fileName;
    }

    /**
     * 设置下载分段
     * @param segment
     * @private
     */
    _setSegment = segment =>{
        if(!segment || segment >5 || segment < 0 ) segment =3;
        this._segment = segment;
    }
    _getSegment = ()=>{
        return this._segment;
    }
    /**
     * 设置当前下载的id
     * @param randomId
     * @private
     */
    _setCurrentDownloadId = randomId =>{
        try{
            this._randomId = randomId;
            let downloadIdFilePath = this._getDownloadIdFilePath();
            writeFile(downloadIdFilePath,randomId+"");
        }catch (error) {
            this._getOnError() && this._getOnError()(error)
        }
    }

    _getDownloadIdFilePath = ()=>{
        let downloadIdFilePath = this._getSavePath()+'/downloadId.txt'
        return downloadIdFilePath;
    }

    _getCurrentDownloadId = ()=>{
        return this._randomId;
    }
    /**
     * 下载
     * @param savePath
     * @param m3u8Url
     * @param fileName
     * @param segment
     * @param onStartDownload
     * @param onEndDownload
     * @param onProgress
     * @param onError
     * @returns {Promise<void>}
     */

    downloadM3U8File =async (savePath, m3u8Url, fileName, segment, onStartDownload, onEndDownload, onProgress,onError)=>{
        let isexists = await exists(savePath);
        if(isexists){
            await  unlink(savePath)
        }
        this._init(savePath, fileName, segment, onStartDownload, onEndDownload, onProgress,onError);
        let isDownloaded = this._isDownloaded();
        if(isDownloaded){
            this._getOnEndDownload() && this._getOnEndDownload()(true)
            return;
        }
        this._readyDownload(m3u8Url);

    }
    /**
     * 准备下载，此阶段进行m3u8的数据解析，获取ts的url集合，然后在进行下载ts文件
     * @param m3u8Url
     * @private
     */
    _readyDownload = (m3u8Url)=>{
        if(this._isM3U8Url(m3u8Url)){
            this._getM3U8Data(m3u8Url).then(text =>{
                if(this._onPause){
                    return;
                }
                let objData = this._parseM3U8Data(text);
                if(objData){
                    this._getM3U8Urls(objData,m3u8Url).then(data=>{

                        let urls = data.urls;
                        if(data.belongArray === 'segments'){
                            this._getOnStartDownload() && this._getOnStartDownload()(true)
                            // 创建文件目录
                            let savePath = this._getSavePath();
                            this._mkdirs(savePath,urls.length).then(() => {

                                this._setCurrentDownloadId(Math.floor(Math.random()*10000000000));
                                let saveTsUrlsKey = this._getTsUrlsStorageKey();
                                AsyncStorage.setItem(saveTsUrlsKey,JSON.stringify(urls));
                                // 存储可用的m3u8文件
                                let availableUrlPrefix =data.availableUrl;
                                this._saveAvailableM3U8(objData,savePath,availableUrlPrefix,this._getFileName());

                                if(this._onPause){
                                    return;
                                }
                                // 开始下载
                                this._startDownloadTs(urls, this._getSegment());
                            })

                            return;
                        }
                        // let downloadIndex = Math.floor(urls.length/2); // 下载中最中间的m3u8视频
                        let downloadIndex = Math.floor(0); // 下载中最中间的m3u8视频
                        this._readyDownload(urls[downloadIndex]);
                    }).catch((error)=>{
                        this._getOnError() && this._getOnError()(error)
                    })
                }
            }).catch(error =>{
                this._getOnError && this._getOnError()(error)
            })
        }
    }

    _init = (savePath, fileName, segment,onStartDownload, onEndDownload, onProgress,onError) => {
        if(savePath.endsWith('/')){
            savePath = savePath.substring(0,savePath.length-1);
        }
        this._setSavePath(savePath);
        this._setOnEndDownload(onEndDownload);
        this._setOnProgress(onProgress);
        this._setFileName(fileName)
        this._setSegment(segment);
        this._setOnError(onError);
        this._setOnStartDownload(onStartDownload);
    }

    /**
     * 获取 当前m3u8 url中的具体内容
     * @param url
     * @returns {Promise<any> | Promise}
     */

    _getM3U8Data = url => {
        return new Promise((resolve, reject) => {
            // if( !url.endsWith('.m3u8') ){
            //     reject("Url isn't a m3u8 link");
            //     return ;
            // }
            axios({
                method: 'get',
                url: url,
                timeout: this._timeout,
            }).then(response => {
                let text = response.data;
                resolve(text);
            }).catch(error => {
                this._getOnError() && this._getOnError()(error)
            })
        });
    }


    /**
     * 解析 m3u8中的内容，获取m3u8中的 url链接数组,以及可用的url前缀
     *
     * @param parserM3U8Data m3u8解析后的数据
     * @returns {Promise<any> | Promise}
     *
     * 注:  url可能是 解析数据中的segment/playlists/mediaGroups
     *               优先返回segment > playlists > mediaGroups
     */
    _getM3U8Urls =async (parserM3U8Data,m3u8Url) => {

        try {
            let data = {...parserM3U8Data};
            let arrSegments = data.segments;
            let objMediaGroups = data.mediaGroups;
            let arrPlaylists = data.playlists;


            let newSegmentsUri = {};
            if(arrSegments && arrSegments.length > 0){
                newSegmentsUri = await this._spliceAvailableUrls(arrSegments,m3u8Url,'segments');
                return newSegmentsUri;
            }

            let newPlaylists = {};
            if(arrPlaylists  && arrPlaylists.length > 0){
                newPlaylists = await this._spliceAvailableUrls(arrPlaylists,m3u8Url,'playlists');
                return newPlaylists;
            }

            let arrMediaGroups = [];
            if(objMediaGroups){
                // 这部分取English语种视频链接
                let objAudio = objMediaGroups.AUDIO;
                if(objAudio){
                    let objStereo =objAudio.stereo;
                    // 立体声
                    if(objStereo){
                        // let objDubbing = objStereo.Dubbing;
                        // if(objDubbing){
                        //     let dubbingUri = objDubbing.uri;
                        //     arrMediGroups.push({uri:dubbingUri});
                        // }
                        let objEnglish = objStereo.English;
                        if(objEnglish){
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri:englishUri});
                        }

                    }
                    let objSurround = objAudio.surround;
                    // 环绕声
                    if(objSurround){
                        // let objDubbing = objSurround.Dubbing;
                        // if(objDubbing){
                        //     let dubbingUri = objDubbing.uri;
                        //     arrMediGroups.push({uri:dubbingUri});
                        // }
                        let objEnglish = objSurround.English;
                        if(objEnglish){
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri:englishUri});
                        }

                    }
                }

                let objSubTitles = objMediaGroups.SUBTITLES;
                if(objSubTitles){
                    let objSubs = objSubTitles.subs;
                    if(objSubs){
                        let objEnglish = objSubs.English;
                        if(objEnglish){
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri:englishUri});
                        }
                    }
                }

                if(arrMediaGroups.length > 0){
                    let newMediaGroups = await this._spliceAvailableUrls(arrMediaGroups,m3u8Url,'mediaGroups');
                    return newMediaGroups;
                }

            }

        } catch (error) {
            this._getOnError() && this._getOnError()(error)
        }

    }
    // 拼接url,返回可用的url数组，以及可用的url前缀
    // 注： 可用的url前缀指的是 ： 可用的url前缀 拼接上相关的ts分片链接形成正常的url
    /**
     *
     * @param urls   当前m3u8 链接解析出来后的某个数组段
     * @param m3u8Url 当前m3u8 链接
     * @param isBelongArray  属于哪个数组 , 可取值有：'segments' / 'playlists' / 'mediaGroups'
     * @returns {Promise<*>}
     * @private
     */
    _spliceAvailableUrls =async (urls,m3u8Url,belongArray)=>{
        let newArrUrl = [];
        try{
            let arrStr = m3u8Url.split('/');
            arrStr.splice(1,1);
            let prefixUri = arrStr[0]+"//"+arrStr[1];
            let firstUrl = urls[0].uri;
            let isAvailableUrl = false;
            // 拼接可用的url
            if (firstUrl && !firstUrl.startsWith('http')) {
                if(!firstUrl.startsWith('/')){
                    firstUrl = '/'+firstUrl;
                }
                let newSegmentUrl = prefixUri + firstUrl;
                isAvailableUrl= await  this._isAvailableUrl(newSegmentUrl);
                if(!isAvailableUrl){
                    let arrPrefixUrl = [];
                    let newPrefixUrl = prefixUri;
                    for(let i = 2;i < arrStr.length - 1;i++){
                        newPrefixUrl = newPrefixUrl+'/'+arrStr[i];
                        arrPrefixUrl.push(newPrefixUrl)
                    }
                    for(let i = arrPrefixUrl.length -1;i >= 0;i++){
                        let verifyUrl = arrPrefixUrl[i] + firstUrl;
                        isAvailableUrl = await  this._isAvailableUrl(verifyUrl)
                        if(isAvailableUrl){
                            prefixUri = arrPrefixUrl[i];
                            break;
                        }
                    }
                }

            }else{
                isAvailableUrl = true;
                prefixUri = '';
            }
            // 存储可用的url
            isAvailableUrl && urls.forEach((item) => {
                let  uri = item.uri;
                if (uri && !uri.startsWith('http')) {
                    if(!uri.startsWith('/')){
                        uri = '/'+uri;
                    }
                    uri = prefixUri + uri;
                }
                newArrUrl.push(uri)
            })
            return {availableUrl:prefixUri,urls:newArrUrl,belongArray:belongArray};
        }catch (error) {
            this._getOnError() && this._getOnError()(error)
        }

    }

    /**
     * 通过Parser解析器对m3u8数据进行封装
     * @param data
     * @returns {*}
     * @private
     */
    _parseM3U8Data = data =>{
        try{
            let parser = new Parser();
            parser.push(data);
            parser.end();
            return parser.manifest;
        }catch (error) {
            this._getOnError() && this._getOnError()(error)
        }
    }


    /**
     * 创建目录
     * @param savePath
     * @param count
     * @returns {Promise<any[]>}
     * @private
     * 注：一个目录存储100个ts文件，目录以 000_099 100_199 形式命名
     *     android 需要动态申请权限创建文件夹
     */
    _mkdirs = async (savePath,count) => {
        let allPromise = [];
        try{
            if(!savePath.endsWith('/')){
                savePath = savePath+'/'
            }
            for (let i = 0; i < count; i++) {
                if (i % 100 === 0) {
                    let dir = Math.floor(i / 100);
                    dir = dir + '00_' + dir + '99';
                    let path = `${savePath}${dir}`;
                    let isExist = await exists(path);
                    if (!isExist) {
                        // allPromise.push(mkdir(path));
                        await mkdir(path);
                    }
                }
            }
        }catch (error) {
            this._getOnError() && this._getOnError()(error)
        }

        return true;
        // return Promise.all(allPromise)

    }
    /**
     *  通过当前索引和url，创建url的存放位置
     * */
    _tsFilePath = (index,url,tsDir) => {
        if(!tsDir.endsWith('/')){
            tsDir = tsDir+'/'
        }
        let dir = Math.floor(index / 100);
        dir = dir + '00_' + dir + '99';
        let last = this._tsFileName(url);
        let filePath = `${tsDir}${dir}/${last}`;
        return filePath;
    }

    _saveLastDownloadIndex = (belongSegment, startIndex, endIndex)=>{
        let saveRandomDataKey = this._getCurrentSegmentStorageKey(belongSegment);
        let saveRandomDataValue =`${startIndex}_${endIndex}`
        AsyncStorage.setItem(saveRandomDataKey,saveRandomDataValue);

    }
    /**
     * 获取当前分段存储的key
     * @param currentSegment
     * @returns {string}
     * @private
     */
    _getCurrentSegmentStorageKey = currentSegment =>{
        return this._getCurrentDownloadId()+"_segment_"+currentSegment;
    }
    /**
     * 获取ts的url集合key
     * @returns {string}
     * @private
     */
    _getTsUrlsStorageKey = () =>{
        return  this._getCurrentDownloadId()+"_urls";
    }
    /**
     *
     * @returns {string}
     * @private
     */
    _getDownloadProgressKey = ()=>{
        return  this._getCurrentDownloadId()+"_progress";
    }


    /**
     * 递归去下载ts文件
     *
     * data：存放所有下载的url链接
     * startIndex：通过当前索引获取下载的url
     * endIndex：下载到endIndex位置结束递归
     * */
    _downloadTsFile =async (data, startIndex, endIndex,belongSegment) => {
        // 暂停下载
        if( this._onPause){
            return;
        }
        // 取消下载
        if(this._onCancel ){
            return;
        }
        // console.warn("curIndex:"+startIndex);
        let savePath = this._getSavePath();
        let tsFilePath = this._tsFilePath(startIndex,data[startIndex],savePath)
        let url = data[startIndex]
        // let url = data[startIndex]+'dd'
        let DownloadFileOptions = {
            fromUrl: url,
            toFile: tsFilePath,
            background: true,
            // progressDivider: 1,
            // begin: (res) => {
            //     //开始下载时回调
            //     // console.log('begin', res);
            // },
            // progress: (res) => {
            //     //下载过程中回调，根据options中设置progressDivider:5，则在完成5%，10%，15%，...，100%时分别回调一次，共回调20次。
            //     // console.log('progress', res)
            // }
            // readTimeout:1000*120,
        }

        let result = downloadFile(DownloadFileOptions);
        result.promise.then(res => {
            // 下载成功后回调进程给onProgress
            this._saveLastDownloadIndex(belongSegment,startIndex,endIndex);
            // 暂停下载
            if( this._onPause){
                return;
            }
            // 取消下载
            if(this._onCancel ){
                return;
            }
            this._setDownloadProgress(res.bytesWritten);

            // if(Platform.OS === 'ios' && AppState.currentState === 'background'){
            //     // 处理ios后台下载
            //     completeHandlerIOS(res.jobId).then(()=>{
            //         let nextIndex = startIndex + 1;
            //         // 结束递归
            //         if (nextIndex >= endIndex) {
            //             this._isDownloaded(onEndDownload);
            //             return;
            //         }
            //         this._downloadTsFile(data, savePath, nextIndex, endIndex,onProgress,onEndDownload)
            //     })
            // }else {
            //     let nextIndex = startIndex + 1;
            //     // 结束递归
            //     if (nextIndex >= endIndex) {
            //         this._isDownloaded(onEndDownload);
            //         return;
            //     }
            //     this._downloadTsFile(data, savePath, nextIndex, endIndex,onProgress,onEndDownload)
            // }

            let nextIndex = startIndex + 1;
            // 结束递归
            // console.warn("startIndex:"+startIndex)
            if (nextIndex >= endIndex) {
                let downloadedCount = this._getDownloadedSegment()+1;
                this._setDownloadedSegment(downloadedCount);
                let isDownloaded = this._isDownloaded();
                // console.warn('isDownloaded:'+isDownloaded)
                if(isDownloaded){
                    this._getOnEndDownload() && this._getOnEndDownload()(true);
                    // let savePath = this._getSavePath();
                    // let fileName = this._getFileName();
                    // this._M3U8ToMP4(savePath+'/'+fileName+'.m3u8',savePath+'/'+fileName+'.mp4')
                }
                return;
            }
            this._downloadTsFile(data,nextIndex, endIndex,belongSegment)

        }).catch(err => {
            //下载出错时执行
            // 如：网络中断
            // console.warn('err')
            this._downloadTsFile(data,startIndex, endIndex,belongSegment)

        })


    }
    /**
     * 设置下载进度
     * @param bytes
     * @private
     */
    _setDownloadProgress = (bytes) =>{
        let downloadedCount = this._getDownloadedCount() + 1;
        this._setDownloadedCount(downloadedCount);
        this._getOnProgress() && this._getOnProgress()({currentDownloadCount:downloadedCount,downloadCount:this._getDownloadCount()});
    }
    /**
     * 已经下载的大小
     * @param bytes
     * @private
     */
    _setDownloadedSize = (bytes) =>{
        this._downloadedSize = bytes;
    }
    _getDownloadedSize = () =>{
        if(!this._downloadedSize){
            this._downloadedSize = 0;
        }
       return this._downloadedSize;
    }
    // 设置当前完成下载的数量
    /**
     * 设置 当前已经完成的下载数量
     * @param count
     * @private
     */
    _setDownloadedCount = count => {
        if(!this._downloadedCount){
            this._downloadedCount = 0;
        }
        this._downloadedCount = count;
    }

    _getDownloadedCount = () => {
        if(!this._downloadedCount){
            this._downloadedCount = 0;
        }
        return this._downloadedCount;
    }
    /**
     * 判断是否下载完成
     * @returns {boolean}
     * @private
     */
    _isDownloaded = ()=>{
        if(this._getSegment() <= 0){
            return false;
        }
        return this._getDownloadedSegment() === this._getSegment();
    }


    /**
     * 设置下载完成的分段
     * @param segment
     * @private
     */
    _setDownloadedSegment = segment =>{
        if(!this._downloadedSegment){
            this._downloadedSegment = 0;
        }
        this._downloadedSegment = segment;
    }

    _getDownloadedSegment = ()=>{
        if(!this._downloadedSegment){
            this._downloadedSegment = 0;
        }
        return this._downloadedSegment;
    }
    /**
     * 保存m3u8文件
     * @param data
     * @param fileDir
     * @param availableUrlPrefix
     * @param indexName
     * @returns {Promise<void>}
     * @private
     */
    _saveAvailableM3U8 =async (data,fileDir,availableUrlPrefix,indexName)=>{
        try{
            let targetDuration =   data.targetDuration;
            let saveText = `#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-TARGETDURATION:${targetDuration}\n`;
            let segments = data.segments;

            segments.forEach((item,index)=>{
                if(item.key){
                    if(index === 0){
                        saveText = this._addM3U8Key(segments[0],saveText,availableUrlPrefix,fileDir);
                    }else if(item.key.uri && item.key.uri !== segments[index-1].key.uri){
                        saveText = this._addM3U8Key(segments[0],saveText,availableUrlPrefix,fileDir);
                    }
                }
                let url = item.uri;
                let duration = item.duration;
                let dir = Math.floor(index / 100);
                dir = dir + '00_' + dir + '99';
                let last = this._tsFileName(url);
                let tsFilePath = `${dir}/${last}`;
                let newText = `#EXTINF:${duration},\n${tsFilePath}\n`;
                saveText = saveText + newText;
            })
            saveText = `${saveText}\n#EXT-X-ENDLIST\n`;
            // console.warn(saveText)
            let filePath = fileDir+'/'+indexName+'.m3u8';
            writeFile(filePath,saveText)
        }catch (error) {
            this._getOnError() && this._getOnError()(error)
        }

    }
    // 给存储的m3u8文件加key
    _addM3U8Key = (data,currentText,availableUrlPrefix,fileDir)=>{
        try{
            if(data.key && data.key.method && data.key.uri){
                let method = data.key.method;
                let uri = data.key.uri;
                let iv = data.key.iv;
                let url = '';
                let newKey = '';
                if(uri.startsWith('http')){
                    url = uri;
                    let split = uri.split('/');
                    newKey = split[split.length - 1]+split[split.length - 2];
                } else{
                    newKey = uri;
                    if(!uri.startsWith('/')){
                        uri = '/'+uri;
                    }
                    url = availableUrlPrefix + uri;
                }

                let key = `#EXT-X-KEY:METHOD=${method},URI="${newKey}"\n`;
                if(iv){
                    key =`#EXT-X-KEY:METHOD=${method},URI="${newKey}",IV=${iv}\n`;
                }
                currentText = currentText + key;

                axios({
                    method:'get',
                    url:url,
                    timeout:this._timeout,
                }).then(response=>{
                    // console.warn(response);
                    if(response.data){
                        let data = response.data;
                        if(!newKey.startsWith('/')){
                            newKey = '/'+newKey;
                        }
                        let keyFilePath = fileDir+newKey;
                        writeFile(keyFilePath,data);
                    }

                }).catch(error=>{
                    this._getOnError() && this._getOnError()(error)
                })
            }
        }catch (e) {
            return currentText;
        }
        return currentText;
    }

    /**
     * 设置ts分片的名字
     * @param url
     * @returns {*|string}
     * @private
     */
    _tsFileName = url =>{
        let split = url.split('/');
        let last = split[split.length - 1];
        if(!last.endsWith('.ts')){
            let newTs = last.split('?');
            last = newTs[0]
        }
        return last;
    }


    /**
     * 验证是否属于m3u8链接
     * @param url
     * @returns {*|boolean}
     * @private
     */
    _isM3U8Url = url=>{
        return url && url.startsWith('http') && url.indexOf('.m3u8') !== -1
    }

    _isAvailableUrl = url =>{
        return new Promise((resolve, reject)=>{
            axios({
                method: 'get',
                url: url,
                timeout: this._timeout,
            }).then(response=>{
                // console.warn(response)
                resolve(true)
            }).catch((error)=>{
                resolve(false)
            })
        })

    }

    /**
     * 设置总的下载个数
     * @param downloadCount
     * @private
     */
    _setDownloadCount = downloadCount =>{
        this._downloadCount = downloadCount;
    }
    /**
     * 获取总的下载个数
     * @returns {*|number}
     * @private
     */
    _getDownloadCount = () =>{
        if(!this._downloadCount){
            this._downloadCount = 0;
        }
        return this._downloadCount;
    }

    /**
     * 下载Data中的ts数据
     * @param data 存放url的集合
     * @param segment 开启几个promise进行下载 默认为3 , 最多开启5个promise
     * @private
     */

    _startDownloadTs = (data, segment) => {
        // 默认开启三个promise进行下载数据
        let downloadSegment = segment;
        let urlCounts = data.length;
        this._setDownloadCount(urlCounts);
        // console.warn(urlCounts)
        let segmentCount = Math.floor(data.length / downloadSegment);
        // 当m3u8中的ts分片数小于当前segment
        if (segmentCount === 0) {
            let startIndex = 0;
            let endIndex = urlCounts;
            this._downloadTsFile(data, startIndex, endIndex,1)
            return;
        }
        for (let i = 0; i < downloadSegment; i++) {
            let startIndex = segmentCount * i;
            let endIndex = segmentCount * (i + 1);
            if (i === downloadSegment - 1) {
                endIndex = urlCounts;
            }
            this._downloadTsFile(data, startIndex, endIndex,i+1)
        }

    }

}
