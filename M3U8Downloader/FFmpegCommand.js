/**
 *
 *而MP4格式的容器，是不带字幕流的。所以如果要将字幕集中进去，就需要将字幕文件烧进视频中去。烧进去的视频，不能再分离出来，也不能控制字幕的显示与否。

 命令如下：

 ffmpeg -y -i 6e28.flv -vf subtitles=subscript.srt tt.mp4

 命令解释：

 -y :覆盖同名的输出文件 

 -i  ：资源文件

 -vf：一般用于设置视频的过滤器 set video filters

 subtitles= ：后面跟字幕文件，可以是srt，ass的
 ---------------------

 *
 *
 *
 *https://www.yanxurui.cc/posts/tool/2017-10-07-use-ffmpeg-to-edit-video/#6-subtitle
 *
 *
 *
 *http://www.iosxxx.com/blog/2017-07-17-iOS%E7%BC%96%E8%A7%A3%E7%A0%81%E5%85%A5%E9%97%A8%E7%AF%87-FFMPEG%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA.html
 *
 主要参数
    -i	                    设置输入档名。
    -f	                    设置输出格式。
    -y	                    若输出文件已存在时则覆盖文件。
    -fs	                    超过指定的文件大小时则结束转换。
    -ss	                    从指定时间开始转换。
    -t	                    从-ss时间开始转换（如-ss 00:00:01.00 -t 00:00:10.00即从00:00:01.00开始到00:00:11.00）。
    -title	                设置标题。
    -timestamp	            设置时间戳。
     -vsync	                增减Frame使影音同步。

 视频参数

    b:a	                    设置每Channel（最近的SVN版为所有Channel的总合）的流量。（单位请引用下方注意事项）
    ar	                    设置采样率。
    ac	                    设置声音的Channel数。
    acodec ( -c:a )     	设置声音编解码器，未设置时与视频相同，使用与输入文件相同之编解码器。
    an	                    不处理声音，于仅针对视频做处理时使用。
    vol	                    设置音量大小，256为标准音量。（要设置成两倍音量时则输入512，依此类推。）

 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */