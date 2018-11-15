export interface CordovaServeBuilderSchema {
  cordovaBuildTarget: string;
  devServerTarget: string;
  platform: string;
  port?: number;
  host?: string;
  ssl?: boolean;
  proxyConfig?: string;
  cordovaBasePath?: string;
  sourceMap?: boolean;
}
