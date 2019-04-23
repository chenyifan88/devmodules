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
    Button,
    SafeAreaView,
    AppState,
    AsyncStorage,
} from 'react-native';
import RNFS from 'react-native-fs'
import M3U8Downloader from './M3U8Downloader'

// const m3u8Uri = 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
const m3u8Uri = 'http://vfile1.grtn.cn/2018/1542/0254/3368/154202543368.ssm/154202543368.m3u8'


const AvailableTsDataInfoConstant = 'AvailableTsDataInfoConstant'
const test = 'AvailableUrlsConstant'

// 对加密ts合成mp4
// ffmpeg -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i index.m3u8 -c copy out.mp4

type Props = {};
export default class App extends Component<Props> {

    constructor(props) {
        super(props);

    }



    render() {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#cc4'}}>
                <Button style={{flex: 1}} title={'parserM3u8'} onPress={async () => {
                    console.warn('parser')
                    if (Platform.OS === 'ios') {
                        this.document = await RNFS.DocumentDirectoryPath;
                    } else {
                        // this.document = await ExternalStorageDirectoryPath;
                        this.document = await RNFS.ExternalDirectoryPath;
                    }
                    let filePath = this.document + "/TsData2/Test.mp4";
                    // this.downloadM3U8File(savePath,m3u8Uri2,3)
                    this.download = new M3U8Downloader();
                    let downloadConfig = {
                        filePath: filePath,
                        m3u8Url: m3u8Uri,
                        segment: 3,
                        onStartReady: result => {
                            console.warn('onStartReady:'+result)
                        },
                        onStartDownload: result => {
                            console.warn('onStartDownload:'+result)
                        },
                        onEndDownload: result => {
                            console.warn('onEndDownload:'+result)
                        },
                        onError: result => {
                            console.warn('onError:'+result)
                        },
                        onProgress: result => {
                            console.warn("onProgress:"+JSON.stringify(result))
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
