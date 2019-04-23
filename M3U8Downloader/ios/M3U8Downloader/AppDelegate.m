/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"
#import <RNFSManager.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <AVFoundation/AVFoundation.h>
@interface AppDelegate ()
@property (nonatomic, strong) AVAudioPlayer *player;
@end
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"M3U8Downloader"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

// https://www.jianshu.com/p/d466f2da0d33 请查看该链接
- (AVAudioPlayer *)avPlayer{
  if (!_player){
    NSURL *url=[[NSBundle mainBundle]URLForResource:@"work5.mp3" withExtension:nil];
    _player = [[AVAudioPlayer alloc]initWithContentsOfURL:url error:nil];
    [_player prepareToPlay];
    //一直循环播放
    _player.numberOfLoops = -1;
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayback error:nil];
    //让 app 支持接受远程控制事件
    [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
    [session setActive:YES error:nil];
  }
  return _player;
}


- (void)applicationWillEnterForeground:(UIApplication *)application {
  
  @try{
    if(self.player != nil){
      [self.player stop];
    }
    
  }@catch(NSException *e){
    
  }
}

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  [RNFSManager setCompletionHandlerForIdentifier:identifier completionHandler:completionHandler];
  //  [self startBgTask];
}
- (void)applicationDidEnterBackground:(UIApplication *)application {

  /** 播放声音 */
  [self.player play];
  [self startBgTask];
  
}
- (void)startBgTask{
  UIApplication *application = [UIApplication sharedApplication];
  __block    UIBackgroundTaskIdentifier bgTask;
  bgTask = [application beginBackgroundTaskWithExpirationHandler:^{
    [application endBackgroundTask:bgTask];
    bgTask = UIBackgroundTaskInvalid;
    NSLog(@"%f",application.backgroundTimeRemaining);
  }];
  
  
}
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
