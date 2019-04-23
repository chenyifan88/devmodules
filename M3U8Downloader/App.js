/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Button,
    SafeAreaView,
    AppState,
    AsyncStorage,
} from 'react-native';

import {
    Parser
} from 'm3u8-parser'
import axios from 'axios'
import RNFS, {
    mkdir,
    exists,
    DocumentDirectoryPath,
    ExternalDirectoryPath,
    ExternalStorageDirectoryPath,
    downloadFile,
    completeHandlerIOS,
} from 'react-native-fs';
import {LogLevel, RNFFmpeg} from 'react-native-ffmpeg';
import M3U8Downloader from './M3U8Downloader'

const m3u8Uri = 'https://sohu.zuida-163sina.com/20190316/drjp3sZB/index.m3u8'
const m3u8Host1 = 'https://sohu.zuida-163sina.com'
const m3u8Uri2 = 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
const m3u8Uri3 = 'http://videocdn.dlyilian.com:8091/20190331/VO6JYDW120/1000kb/hls/index.m3u8'
const m3u8Uri4 = 'http://www.the5fire.com/static/demos/diaosi.m3u8'
const m3u8Uri5 = 'http://play.tiansex.net:2086/uploadmvfiles/2be68c6a964bc74fa74ae22e54f68e48/2be68c6a964bc74fa74ae22e54f68e48.m3u8?md5=h5s27IFYYW-2VBDi4Sb_eg&expires=1555920384'
const m3u8Uri6 = 'http://play.tiansex.net:2086/upload18files/1d9566fc63e2ac43281910bac6280fce/1d9566fc63e2ac43281910bac6280fce.m3u8?md5=MNs0WBMFnqBsNPldPA6s3g&expires=1555920345'


const AvailableTsDataInfoConstant = 'AvailableTsDataInfoConstant'
const test = 'AvailableUrlsConstant'

// 对加密ts合成mp4
// ffmpeg -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i index.m3u8 -c copy out.mp4

type Props = {};
export default class App extends Component<Props> {

    constructor(props) {
        super(props);
        this.downloadSegment = 0; // 分几段下载
        this.downloadedSegment = 0; // 完成几个分段下载
    }

    componentDidMount() {
        // AppState.addEventListener('change', this._handleAppStateChange);
        this.init();

    }

    componentWillUnmount() {
        // AppState.removeEventListener('change', this._handleAppStateChange);
    }

    _handleAppStateChange = (nextAppState) => {
        console.warn(nextAppState)
    }

    _testDownload = (testData, index) => {
        RNBackgroundDownloader.download({
            id: 'file123cxbv',
            url: testData[index],
            destination: `${this.document}/M3U8Tmp/test_${index}.apk`
        }).begin((expectedBytes) => {
            console.log(`Going to download ${expectedBytes} bytes!`);
        }).progress((percent) => {
            console.log(`Downloaded: ${percent * 100}%`);
        }).done(() => {
            console.log('Download is done!');

            setTimeout(() => {
                console.warn('index:' + index)
                this._testDownload(testData, ++index)
            }, 0);

        }).error((error) => {
            console.log('Download canceled due to error: ', error);
        });
    }

    init = async () => {
        if (Platform.OS === 'ios') {
            this.document = await DocumentDirectoryPath;
        } else {
            // this.document = await ExternalStorageDirectoryPath;
            this.document = await ExternalDirectoryPath;
        }
        console.warn(this.document)
    }


    // getM3u8Info = url => {
    //     fetch(url).then(response => {
    //             console.warn(response)
    //             return response.text();
    //         }
    //     ).then(data => {
    //         // console.warn('data:'+data)
    //         this.getM3U8Urls(data)
    //
    //     }).catch(error => {
    //         console.warn(error);
    //     });
    // }

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
                timeout: 10000,
            }).then(response => {
                let text = response.data;
                resolve(text);
            }).catch(error => {
                reject(error)
            })
        });
    }

    _getData = url => {

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
    _getM3U8Urls = async (parserM3U8Data, m3u8Url) => {

        try {
            let data = {...parserM3U8Data};
            let arrSegments = data.segments;
            let objMediaGroups = data.mediaGroups;
            let arrPlaylists = data.playlists;


            let newSegmentsUri = {};
            if (arrSegments && arrSegments.length > 0) {
                newSegmentsUri = await this._spliceAvailableUrls(arrSegments, m3u8Url, 'segments');
                return newSegmentsUri;
            }

            let newPlaylists = {};
            if (arrPlaylists && arrPlaylists.length > 0) {
                newPlaylists = await this._spliceAvailableUrls(arrPlaylists, m3u8Url, 'playlists');
                return newPlaylists;
            }

            let arrMediaGroups = [];
            if (objMediaGroups) {
                // 这部分取English语种视频链接
                let objAudio = objMediaGroups.AUDIO;
                if (objAudio) {
                    let objStereo = objAudio.stereo;
                    // 立体声
                    if (objStereo) {
                        // let objDubbing = objStereo.Dubbing;
                        // if(objDubbing){
                        //     let dubbingUri = objDubbing.uri;
                        //     arrMediGroups.push({uri:dubbingUri});
                        // }
                        let objEnglish = objStereo.English;
                        if (objEnglish) {
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri: englishUri});
                        }

                    }
                    let objSurround = objAudio.surround;
                    // 环绕声
                    if (objSurround) {
                        // let objDubbing = objSurround.Dubbing;
                        // if(objDubbing){
                        //     let dubbingUri = objDubbing.uri;
                        //     arrMediGroups.push({uri:dubbingUri});
                        // }
                        let objEnglish = objSurround.English;
                        if (objEnglish) {
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri: englishUri});
                        }

                    }
                }

                let objSubTitles = objMediaGroups.SUBTITLES;
                if (objSubTitles) {
                    let objSubs = objSubTitles.subs;
                    if (objSubs) {
                        let objEnglish = objSubs.English;
                        if (objEnglish) {
                            let englishUri = objEnglish.uri;
                            arrMediaGroups.push({uri: englishUri});
                        }
                    }
                }

                if (arrMediaGroups.length > 0) {
                    let newMediaGroups = await this._spliceAvailableUrls(arrMediaGroups, m3u8Url, 'mediaGroups');
                    return newMediaGroups;
                }

            }

        } catch (e) {
            return e;
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
    _spliceAvailableUrls = async (urls, m3u8Url, belongArray) => {
        let newArrUrl = [];
        try {
            let arrStr = m3u8Url.split('/');
            arrStr.splice(1, 1);
            let prefixUri = arrStr[0] + "//" + arrStr[1];
            let firstUrl = urls[0].uri;
            let isAvailableUrl = false;
            // 拼接可用的url
            if (firstUrl && !firstUrl.startsWith('http')) {
                if (!firstUrl.startsWith('/')) {
                    firstUrl = '/' + firstUrl;
                }
                let newSegmentUrl = prefixUri + firstUrl;
                isAvailableUrl = await this._isAvailableUrl(newSegmentUrl);
                if (!isAvailableUrl) {
                    let arrPrefixUrl = [];
                    let newPrefixUrl = prefixUri;
                    for (let i = 2; i < arrStr.length - 1; i++) {
                        newPrefixUrl = newPrefixUrl + '/' + arrStr[i];
                        arrPrefixUrl.push(newPrefixUrl)
                    }
                    for (let i = arrPrefixUrl.length - 1; i >= 0; i++) {
                        let verifyUrl = arrPrefixUrl[i] + firstUrl;
                        isAvailableUrl = await this._isAvailableUrl(verifyUrl)
                        if (isAvailableUrl) {
                            prefixUri = arrPrefixUrl[i];
                            break;
                        }
                    }
                }

            } else {
                isAvailableUrl = true;
                prefixUri = '';
            }
            // 存储可用的url
            isAvailableUrl && urls.forEach((item) => {
                let uri = item.uri;
                if (uri && !uri.startsWith('http')) {
                    if (!uri.startsWith('/')) {
                        uri = '/' + uri;
                    }
                    uri = prefixUri + uri;
                }
                newArrUrl.push(uri)
            })
            return {availableUrl: prefixUri, urls: newArrUrl, belongArray: belongArray};
        } catch (e) {
            return undefined;
        }

    }

    /**
     * 通过Parser解析器对m3u8数据进行封装
     * @param data
     * @returns {*}
     * @private
     */
    _parseM3U8Data = data => {
        try {
            let parser = new Parser();
            parser.push(data);
            parser.end();
            return parser.manifest;
        } catch (e) {
            return undefined;
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
    _mkdirs = async (savePath, count) => {
        let allPromise = [];
        if (!savePath.endsWith('/')) {
            savePath = savePath + '/'
        }
        for (let i = 0; i < count; i++) {
            if (i % 100 === 0) {
                try {
                    let dir = Math.floor(i / 100);
                    dir = dir + '00_' + dir + '99';
                    let path = `${savePath}${dir}`;
                    let isExist = await exists(path);
                    console.warn("isExist:" + isExist + "  path:" + path)
                    if (!isExist) {
                        allPromise.push(mkdir(path));
                    }
                } catch (e) {

                }

            }
        }
        return Promise.all(allPromise)

    }
    /**
     *  通过当前索引和url，创建url的存放位置
     * */
    _tsFilePath = (index, url, tsDir) => {
        if (!tsDir.endsWith('/')) {
            tsDir = tsDir + '/'
        }
        let dir = Math.floor(index / 100);
        dir = dir + '00_' + dir + '99';
        let split = url.split('/');
        let last = split[split.length - 1];
        if (!last.endsWith('.ts')) {
            let newTs = last.split('?');
            last = newTs[0]
        }
        let filePath = `${tsDir}${dir}/${last}`;
        return filePath;
    }
    /**
     * 递归去下载ts文件
     *
     * data：存放所有下载的url链接
     * savePath：存放当前url数据
     * startIndex：通过当前索引获取下载的url
     * endIndex：下载到endIndex位置结束递归
     * */
    _downloadTsFile = async (data, savePath, startIndex, endIndex) => {

        console.warn("curIndex:" + startIndex);
        let tsFilePath = this._tsFilePath(startIndex, data[startIndex], savePath)
        let url = data[startIndex]
        // let url = data[startIndex]+'dd'
        let DownloadFileOptions = {
            fromUrl: url,
            toFile: tsFilePath,
            background: true,
            progressDivider: 1,
            // begin: (res) => {
            //     //开始下载时回调
            //     // console.log('begin', res);
            // },
            // progress: (res) => {
            //     //下载过程中回调，根据options中设置progressDivider:5，则在完成5%，10%，15%，...，100%时分别回调一次，共回调20次。
            //     // console.log('progress', res)
            // }
            readTimeout: 1000 * 120,
        }

        let result = downloadFile(DownloadFileOptions);
        result.promise.then(res => {
            if (Platform.OS === 'ios' && AppState.currentState === 'background') {
                // 处理ios后台下载
                completeHandlerIOS(res.jobId).then(() => {
                    let nextIndex = startIndex + 1;
                    // 结束递归
                    if (nextIndex >= endIndex) {
                        let downloadedSegment = this._getDownloadedSegment() + 1;
                        console.warn('_downloadedSegment:' + downloadedSegment);
                        this._setDownloadedSegment(downloadedSegment);
                        if (downloadedSegment === this._getDownloadSegment()) {
                            console.warn('下载完成')
                        }
                        return;
                    }
                    this._downloadTsFile(data, savePath, nextIndex, endIndex)
                })
            } else {
                let nextIndex = startIndex + 1;
                // 结束递归
                if (nextIndex >= endIndex) {
                    let downloadedSegment = this._getDownloadedSegment() + 1;
                    console.warn('_downloadedSegment:' + downloadedSegment);
                    this._setDownloadedSegment(downloadedSegment);
                    if (downloadedSegment === this._getDownloadSegment()) {
                        console.warn('下载完成')
                    }
                    return;
                }
                this._downloadTsFile(data, savePath, nextIndex, endIndex)
            }

        }).catch(err => {
            //下载出错时执行
            // 如：网络中断
            console.warn('err')
            this._downloadTsFile(data, savePath, startIndex, endIndex)

        })


    }

    _isDownloaded = () => {
        let result = false;
        let downloadedSegment = this._getDownloadedSegment() + 1;
        console.warn('_downloadedSegment:' + downloadedSegment);
        this._setDownloadedSegment(downloadedSegment);
        if (downloadedSegment === this._getDownloadSegment()) {
            console.warn('下载完成');
            result = true;
        }
        return result;
    }

    /**
     * 设置下载分段
     * @param segment
     * @private
     */
    _setDownloadSegment = segment => {
        this.downloadSegment = segment;
    }
    _getDownloadSegment = () => {
        return this.downloadSegment;
    }
    /**
     * 设置下载完成的分段
     * @param segment
     * @private
     */
    _setDownloadedSegment = segment => {
        this.downloadedSegment = segment;
    }

    _getDownloadedSegment = () => {
        return this.downloadedSegment;
    }


    /**
     * 下载m3u8的数据
     * @param savePath   存储路径
     * @param m3u8Url    m3u8链接
     * @param segment    分成几段下载，默认为3段，最大为5段
     */

    downloadM3U8File = (savePath, m3u8Url, segment) => {
        if (this._isM3U8Url(m3u8Url)) {
            this._getM3U8Data(m3u8Url).then(text => {
                // text = '#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-TARGETDURATION:15\n#EXT-X-KEY:METHOD=AES-128,URI="https://priv.example.com/key.php?r=52"\n#EXTINF:15,\nhttp://media.example.com/fileSequence52-1.ts\n#EXTINF:15,\nhttp://media.example.com/fileSequence52-2.ts\n#EXTINF:15,\nhttp://media.example.com/fileSequence52-3.ts\n#EXT-X-KEY:METHOD=AES-128,URI="https://priv.example.com/key.php?r=53"\n#EXTINF:15,\nhttp://media.example.com/fileSequence52-3.ts\n#EXT-X-ENDLIST '
                let objData = this._parseM3U8Data(text);
                if (objData) {
                    this._getM3U8Urls(objData, m3u8Url).then(data => {
                        let urls = data.urls;
                        if (data.belongArray === 'segments') {
                            // console.warn(objData)
                            // 存储可用的ts 数据链接/时长信息等

                            if (savePath.endsWith('/')) {
                                savePath = savePath.substring(0, savePath.length - 1);
                            }
                            // savePath = savePath+'/TsTmpFile'
                            this._mkdirs(savePath, urls.length).then(() => {

                                // 存储可用的m3u8文件
                                let availableUrlPrefix = data.availableUrl;
                                this._saveAvailableM3U8(objData, `${savePath}`, availableUrlPrefix);

                                let split = savePath.split('/');
                                let tsDataInfo = split[split.length - 1];
                                AsyncStorage.setItem(tsDataInfo, JSON.stringify(data));
                                this._setDownloadSegment(segment);
                                AsyncStorage.setItem(tsDataInfo + 'Segment', '' + this._getDownloadSegment());

                                // 开始下载
                                this._download(savePath, urls, segment);
                            })

                            return;
                        }
                        let downloadIndex = Math.floor(urls.length / 2); // 下载中最中间的m3u8视频
                        console.warn('downloadindex:' + downloadIndex)
                        this.downloadM3U8File(savePath, urls[downloadIndex], segment);
                    }).catch(() => {

                    })
                }
            }).catch(error => {
                console.warn(error)
            })
        }
    }

    _saveAvailableM3U8 = async (data, fileDir, availableUrlPrefix) => {
        try {
            let targetDuration = data.targetDuration;
            let saveText = `#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-TARGETDURATION:${targetDuration}\n`;
            let segments = data.segments;
            if (segments && segments[0].key && segments[0].key.uri) {
                let method = segments[0].key.method;
                let uri = segments[0].key.uri;
                let newKey = 'key';
                let key = `#EXT-X-KEY:METHOD=${method},URI="${newKey}"\n`;
                saveText = saveText + key;
                let url = '';
                if (!uri.startsWith('/')) {
                    uri = '/' + uri;
                    url = availableUrlPrefix + uri;
                } else {
                    url = uri;
                }
                axios({
                    method: 'get',
                    url: url,
                    timeout: 15000,
                }).then(response => {
                    console.warn(response);
                    if (response.data) {
                        let data = response.data;
                        let keyFilePath = fileDir + newKey;
                        RNFS.writeFile(keyFilePath, data);
                    }

                }).catch(error => {

                })
            }
            segments.forEach((item, index) => {
                let url = item.uri;
                let duration = item.duration;
                let dir = Math.floor(index / 100);
                dir = dir + '00_' + dir + '99';
                let split = url.split('/');
                let last = split[split.length - 1];
                let tsFilePath = `${dir}/${last}`;
                let newText = `#EXTINF:${duration},\n${tsFilePath}\n`;
                saveText = saveText + newText;
            })
            saveText = `${saveText}\n#EXT-X-ENDLIST\n`;
            console.warn(saveText)
            let filePath = fileDir + '/index.m3u8';
            RNFS.writeFile(filePath, saveText)
        } catch (e) {

        }

    }


    /**
     * 验证是否属于m3u8链接
     * @param url
     * @returns {*|boolean}
     * @private
     */
    _isM3U8Url = url => {
        return url && url.startsWith('http') && url.indexOf('.m3u8') !== -1
    }

    _isAvailableUrl = url => {
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: url,
                timeout: 15000,
            }).then(response => {
                // console.warn(response)
                resolve(true)
            }).catch((error) => {
                resolve(false)
            })
        })

    }


    /**
     * 下载Data中的ts数据
     * @param data 存放url的集合
     * @param segment 开启几个promise进行下载 默认为3 , 最多开启5个promise
     * @private
     */

    _download = (savePath, data, segment) => {
        // 默认开启三个promise进行下载数据
        let downloadSegment = segment;
        if (!segment || segment > 5) {
            downloadSegment = 3;
        }
        let urlCounts = data.length;
        console.warn(urlCounts)
        let segmentCount = Math.floor(data.length / downloadSegment);
        if (segmentCount === 0) {
            let startIndex = 0;
            let endIndex = urlCounts;
            this._downloadTsFile(data, savePath, startIndex, endIndex)
            return;
        }
        for (let i = 0; i < downloadSegment; i++) {
            let startIndex = segmentCount * i;
            let endIndex = segmentCount * (i + 1);
            if (i === downloadSegment - 1) {
                endIndex = urlCounts;
            }
            this._downloadTsFile(data, savePath, startIndex, endIndex)
        }

    }


    render() {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#cc4'}}>
                <Button style={{flex: 1}} title={'parserM3u8'} onPress={async () => {
                    console.warn('parser')
                    let filePath = this.document + "/TsData/Test.mp4";
                    let fileName = 'Test';
                    // this.downloadM3U8File(savePath,m3u8Uri2,3)
                    this.download = new M3U8Downloader();
                    let downloadConfig = {
                        filePath: filePath,
                        m3u8Url: m3u8Uri2,
                        segment: 3,
                        onStartReady: result => {
                            console.warn(result)
                        },
                        onStartDownload: result => {
                            console.warn(result)
                        },
                        onEndDownload: result => {
                            console.warn(result)
                        },
                        onError: result => {
                            console.warn(result)
                        },
                        onProgress: result => {
                            console.warn("downloadProgress:"+result)
                        },
                        resume:true,
                    }

                    this.download.downloadM3U8File(downloadConfig);


                }}/>
                <Button style={{flex: 1}} title={'pause'} onPress={async () => {
                    console.warn('parser')
                    this.download&&this.download.pause();
                }}/>
                <Button style={{flex: 1}} title={'start'} onPress={async () => {
                    console.warn('start')
                    this.download&&this.download.start();
                }}/>
            </SafeAreaView>
        );
    }

}
