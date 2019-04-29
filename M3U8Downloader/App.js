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
    View,
} from 'react-native';
import RNFS from 'react-native-fs'
import M3U8Downloader from './M3U8Downloader'

// const m3u8Uri = 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
// const m3u8Uri = 'http://vfile1.grtn.cn/2018/1542/0254/3368/154202543368.ssm/154202543368.m3u8'
// const m3u8Uri = 'http://play.tiansex.net:2095/avid57982102c3d5e/avid57982102c3d5e.m3u8?md5=15OPrZBvhAsGiNEfgRR5jw&expires=1556248514'
// const m3u8Uri = 'http://vfile1.grtn.cn/2018/1542/0254/3368/154202543368.ssm/154202543368.m3u8'
const m3u8Uri = 'http://videocdn.dlyilian.com:8091/20190331/VO6JYDW120/1000kb/hls/index.m3u8'

import FFmpeg from "./FFmpeg";

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
                        this.document =  RNFS.DocumentDirectoryPath;
                    } else {
                        // this.document = await ExternalStorageDirectoryPath;
                        this.document =  RNFS.ExternalDirectoryPath;
                    }
                    console.warn(this.document)
                    // this.setFontconfigConfguration(this.document);
                    // this.setCustomFontDirectory(this.document);
                    //
                    // // // let filePath = this.document + "/TsData2/Test.mp4";
                    // let filePath = this.document + "/TsData2/test.mp4";
                    // let srtPath = this.document + '/TsData2/test.srt';
                    // let assPath = this.document + '/TsData2/test.ass';
                    // let m3u8FilePath = this.document + "/TsData2/test.m3u8";
                    // let m3u8FilePath = this.document + "/TsData2/ts/index.m3u8";
                    // let outputPath = this.document + "/TsData2/ts/out.mp4";
                    // let outputPath2 = this.document + "/TsData2/index.mp4";
                    //
                    // //-i input.mp4 -i subtitles.srt -c:s mov_text -c:v copy -c:a copy output.mp4
                    // // let command = `-i ${filePath} -i ${srtPath} -c:s mov_text -c:v copy -c:a copy test3.mp4`
                    // // let command = `-i ${srtPath} ${assPath}`
                    // // let command = `-i ${filePath} -vf subtitles=${srtPath} ${outputPath}`
                    // // let command = `-i ${filePath} -vf ass=${assPath} ${outputPath2}`
                    // // let command = `-i ${filePath} -vcodec copy -acodec copy ${outputPath2}`;
                    // // let command = `-i ${m3u8FilePath} -vcodec copy -acodec copy ${outputPath}`;
                    // let command = `-allowed_extensions ALL -i ${m3u8FilePath} -c copy ${outputPath}`;
                    // let result = await RNFS.exists(m3u8FilePath)
                    // if(result){
                    //
                    //     // FFmpeg.encryptM3u8CompositeMP4(m3u8FilePath,outputPath,res=>{
                    //     //     console.warn(res)
                    //     // })
                    //
                    //     let fontDir = this.document+"/fontFile";
                    //     let fontName = "Songti.ttc";
                    //     FFmpeg.textCompositeMP4(outputPath,"文字添加到视频上，坐标x=100,y=200",fontDir,fontName,"red",36,100,200,outputPath2,res=>{
                    //         console.warn(res)
                    //     });
                    //
                    //     // FFmpeg.m3u8ToMP4(m3u8FilePath,outputPath,result=>{
                    //     //     console.warn(result)
                    //     // })
                    //
                    //     // FFmpeg.execute(command," ").then(res =>{
                    //     //     console.warn(res)
                    //     // }).catch(error=>{
                    //     //     console.warn(error)
                    //     // })
                    // }
                    //
                    // return;

                    // this.downloadM3U8File(savePath,m3u8Uri2,3)
                    let downloadM3u8FilePath = this.document + "/ts/index.m3u8";
                    let downloadOutputPath = this.document + "/ts/out.mp4";
                    // 设置下载
                    let downloadConfig = {
                        filePath: downloadM3u8FilePath,
                        m3u8Url: m3u8Uri,
                        segment: 3,
                        onStartReady: result => {
                            console.warn('onStartReady:'+result)
                        },
                        onStartDownload: result => {
                            console.warn('onStartDownload:'+result)
                        },
                        onEndDownload: result => {
                            if(result){
                                // FFmpeg.m3u8CompositeMP4(downloadM3u8FilePath,downloadOutputPath, result=>{
                                //     console.warn(result)
                                // })
                                FFmpeg.encryptM3u8CompositeMP4(downloadM3u8FilePath,downloadOutputPath,result=>{
                                    console.warn(result)
                                })
                            }
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
                    if(!this.download){
                        this.download = new M3U8Downloader();
                    }
                    this.download.downloadM3U8File(downloadConfig);


                }}/>
                <Button style={{flex: 1}} title={'pause'} onPress={async () => {
                    console.warn('parser')
                    this.download&&this.download.pause();
                }}/>
                <Button style={{flex: 1}} title={'cancel'} onPress={async () => {
                    console.warn('cancel')
                    this.download&&this.download.cancel();
                }}/>
                <View style={{width:100,height:100,backgroundColor:'gray',padding:20}}>
                    <View style={{width:40,height:40,backgroundColor:'red'}}></View>
                </View>
            </SafeAreaView>
        );
    }

}
