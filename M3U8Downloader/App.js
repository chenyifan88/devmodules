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
import {RNFFmpeg} from 'react-native-ffmpeg';

const AvailableTsDataInfoConstant = 'AvailableTsDataInfoConstant'
const test = 'AvailableUrlsConstant'

// 对加密ts合成mp4
// ffmpeg -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i index.m3u8 -c copy out.mp4

type Props = {};
export default class App extends Component<Props> {

    constructor(props) {
        super(props);

    }

    setCustomFontDirectory(cache) {
        console.log("Registering cache directory as font directory.");
        // let cache = RNFS.CachesDirectoryPath;
        console.warn("_______________"+cache);
        RNFFmpeg.setFontDirectory(cache, {my_easy_font_name: "my complex font name", my_font_name_2: "my complex font name"});
    }

    setFontconfigConfguration(cache) {
        console.log("Registering cache directory as fontconfig directory.");

        RNFFmpeg.setFontconfigConfigurationPath(cache);
    }

    render() {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: '#cc4'}}>
                <Button style={{flex: 1}} title={'parserM3u8'} onPress={async () => {
                    console.warn('parser')
                    if (Platform.OS === 'ios') {
                        this.document =  RNFS.DocumentDirectoryPath;
                    } else {
                        // this.document = await ExternalStorageDirectoryPath;
                        this.document =  RNFS.ExternalDirectoryPath;
                    }
                    console.warn(this.document)
                    this.setFontconfigConfguration(this.document);
                    this.setCustomFontDirectory(this.document);

                    // // let filePath = this.document + "/TsData2/Test.mp4";
                    let filePath = this.document + "/TsData2/test.mp4";
                    let srtPath = this.document + '/TsData2/test.srt';
                    let assPath = this.document + '/TsData2/test.ass';
                    let m3u8FilePath = this.document + "/TsData/index.m3u8";
                    let outputPath = this.document + "/TsData2/out.mp4";
                    let outputPath2 = this.document + "/TsData2/index.mov";

                    //-i input.mp4 -i subtitles.srt -c:s mov_text -c:v copy -c:a copy output.mp4
                    // let command = `-i ${filePath} -i ${srtPath} -c:s mov_text -c:v copy -c:a copy test3.mp4`
                    // let command = `-i ${srtPath} ${assPath}`
                    let command = `-i ${filePath} -vf subtitles=${srtPath} ${outputPath}`
                    // let command = `-i ${filePath} -vf ass=${assPath} ${outputPath2}`
                    // let command = `-i ${filePath} -vcodec copy -acodec copy ${outputPath2}`;
                    // let command = `-i ${m3u8FilePath} -vcodec copy -acodec copy ${outputPath}`;
                    let result = await RNFS.exists(srtPath)
                    if(result){
                        RNFFmpeg.execute(command," ").then(res =>{
                            console.warn(res)
                        }).catch(error=>{
                            console.warn(error)
                        })
                    }

                    return;

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
