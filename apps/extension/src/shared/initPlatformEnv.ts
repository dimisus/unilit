import { PlatformEnv } from '@unisat/wallet-shared';

PlatformEnv.VERSION = process.env.release!;
PlatformEnv.CHANNEL = process.env.channel!;
PlatformEnv.PLATFORM = 'extension';
PlatformEnv.MANIFEST_VERSION = process.env.manifest!;
PlatformEnv.REVIEW_URL = 'https://github.com/dimisus/unilit';

export const initPlatformEnv = async () => {
  //   await deviceService.preloadDeviceUUID();
  //   PlatformEnv.UDID2 = deviceService.getDeviceUUID();
};
