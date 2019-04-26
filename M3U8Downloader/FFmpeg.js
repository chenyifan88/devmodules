
import {RNFFmpeg} from 'react-native-ffmpeg';
export default class FFmpeg {
    /**
     * 执行普通的ffmpeg命令
     * @param command
     * @param delimiter
     * @param callback
     */
    static execute(command,delimiter,callback){
        RNFFmpeg.execute(command,delimiter).then(result=>{
            callback(result)
        })
    }

    /**
     * m3u8文件转为mp4
     * @param m3u8FilePath
     * @param mp4OutputPath
     * @param callback
     */
    static m3u8ToMP4(m3u8FilePath,mp4OutputPath,callback){
        let command = `-i ${m3u8FilePath} -vcodec copy -acodec copy ${mp4OutputPath}`;
        RNFFmpeg.execute(command," ").then(result=>{
            callback(result)
        })
    }

    /**
     * 加密的m3u8文件转为mp4
     * @param encryptM3u8FilePath
     * @param mp4OutputPath
     * @param callback
     */
    static encryptM3u8CompositeMP4(encryptM3u8FilePath,mp4OutputPath,callback){
        // 对加密ts合成mp4
        // ffmpeg -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i index.m3u8 -c copy out.mp4
        let command = `-allowed_extensions ALL -i ${encryptM3u8FilePath} -c copy ${mp4OutputPath}`;
        RNFFmpeg.execute(command," ").then(result=>{
            callback(result)
        })
    }

    /**
     * srt字幕合成到输入的mp4文件中
     * @param mp4InputPath
     * @param srtFilePath
     * @param mp4OutputPath
     * @param callback
     */
    static srtCompositeMP4(mp4InputPath,srtFilePath,fontPath,mp4OutputPath,callback){
        RNFFmpeg.setFontconfigConfigurationPath(fontPath);
        RNFFmpeg.setFontDirectory(fontPath, {my_easy_font_name: "my complex font name", my_font_name_2: "my complex font name"});
        let command = `-i ${mp4InputPath} -vf subtitles=${srtFilePath} ${mp4OutputPath}`
        RNFFmpeg.execute(command," ").then(result=>{
            callback(result)
        })
    }

    /**
     * ass字幕合成到输入的mp4文件中
     * @param mp4InputPath
     * @param assFilePath
     * @param fontPath
     * @param mp4OutputPath
     * @param callback
     */
    static assCompositeMP4(mp4InputPath,assFilePath,fontPath,mp4OutputPath,callback){
        RNFFmpeg.setFontconfigConfigurationPath(fontPath);
        RNFFmpeg.setFontDirectory(fontPath, {my_easy_font_name: "my complex font name", my_font_name_2: "my complex font name"});
        let command = `-i ${mp4InputPath} -vf ass=${assFilePath} ${mp4OutputPath}`
        RNFFmpeg.execute(command," ").then(result=>{
            callback(result)
        })
    }

    /**
     * 添加文字到视频中
     * @param mp4InputPath
     * @param text
     * @param fontFile
     * @param fontColor
     * @param fontSize
     * @param x
     * @param y
     * @param mp4OutputPath
     */
    static textCompositeMP4(mp4InputPath,text,fontPath,fontColor,fontSize,x,y,mp4OutputPath,callback){
        let fontFile = fontPath;
        let command = `-i ${mp4InputPath} -vf drawtext='fontfile=${fontFile}:fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}:text=${text}' ${mp4OutputPath}`
        console.warn("command:_"+command);
        RNFFmpeg.execute(command," ").then(result=>{
            callback(result)
        })
    }

}