/**
 *

 https://www.jianshu.com/c/5cef16ba6351  这篇写的好
 https://www.jianshu.com/p/2a9571ca227e 字体



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
    加密m3u8的ts 合成 mp4

    ffmpeg -allowed_extensions ALL -i HdNz1kaz.m3u8 -c copy new.mp4

*

 http://www.52ffmpeg.com/command
 使用ffmpeg.exe新版本可以使用-vf来添加水印，
 具体如：ffmpeg.exe  -i xcaq1.mp4 -vf "drawtext=fontfile=simhei.ttf: text='乡村爱情':x=100:y=100:fontsize=28:fontcolor=green:shadowy=2" out.mp4

 解释一下-vf里的参数：

     drawtext=代表要在视频里添加文字
     fontfile=simhei.ttf代表字体，这里指定字体文件
     text='乡村爱情'代表文字内容
     x=100代表文字横坐标
     y=100代表文字纵坐标
     fontsize=代表字体大小
     fontcolor=代表字体颜色
     shadowy=代表y方向的阴影

 https://blog.51cto.com/yuanhuan/1246370
 视频格式转换
 将mp4转换为flv格式
 ：ffmpeg -y -iD:\Download\beijing5-360p.mp4 -ab 56k -ar 22050 -b:v 500k -r 29.97 -s 640x358D:\Download\beijing5-360p.flv：

 1.–y表示覆盖输出文件；

 2.–i表示输入文件；

 3.–ab表示音频数据流量，一般选择32、64、96、128；

 4.–ar表示音频采样率，单位为Hz；

 5.–b:v表示视频码率；

 6.–r表示帧速率，单位为Hz；

 7.–s640x358表示帧尺寸，输出的分辨率为640x358；

 8.D:\Download\beijing5-360p.flv表示输出的文件。

 截图
 ffmpeg -y -iD:\Download\beijing5-360p.mp4 -ss 165.000 -frames 1 -f p_w_picpath2D:\Download\p_w_picpaths\cap%3d.jpg
 1.–y表示覆盖输出文件；
 2.–iD:\Download\beijing5-360p.mp4表示输入文件；
 3.-ss165.000表示起始时间为165.000秒；
 4.-frames1表示只记录一个帧；
 5.-fp_w_picpath2表示格式为p_w_picpath2；
 6.D:\Download\p_w_picpaths\cap%3d.jpg表示输出文件，%3d类似C语言的数字输出格式，输出为3位数字。


 https://github.com/feixiao/ffmpeg/blob/master/src/B_FFmpeg%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md




 https://blog.csdn.net/DeliaPu/article/details/76162489
 ffmpeg  -i bingheshiji.ts  -c:v libx264 -preset veryfast  -s 1280x720 -r 25  -b:v 1500k  -bufsize 1500k -maxrate 1500k -minrate 1500k 

 -rc_init_occupancy 1125k  -max_delay 1.4M  -vf 

 drawtext="fontfile=/usr/share/fonts/truetype/freefont/FreeMono.ttf:textfile=text.txt:x=100:y=200:fontsize=50:

 fontcolor=0xFF0000:reload=1" -c:a libfdk_aac -profile:a aac_low  -b:a 64k  -ar 48000 -ac 2 -muxrate 2000k -f mpegts  

 -max_interleave_delta 1000000  addtext.ts

 滤镜参数说明：

 drawtext是用来添加文字的滤镜名称；

 fontfile：指定的字体文件；

 textfile：需要添加的文字文件，也可以用text=‘Hello world’这种格式指定需要添加的文字，但是对于大量文字，显然文件更为方便；

 x，y：文字左上角在画面上显示的位置；

 fontsize：字体大小；

 fontcolor：字体颜色，可以通过0xRRGGBB@0.X来指定文字的透明度，例如0xFF0000@0.5为红色半透明。

 reload：为1时表示每帧重新load字体文件，可以实现实时更新显示文字的功能。

 https://www.jianshu.com/p/2a9571ca227e









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