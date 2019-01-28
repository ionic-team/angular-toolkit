export interface CordovaServeBuilderSchema {
  cordovaBuildTarget: string;
  devServerTarget: string;
  platform?: string;
  port?: number;
  host?: string;
  ssl?: boolean;
  cordovaBasePath?: string;
  sourceMap?: boolean;
  cordovaAssets?: boolean;
  cordovaMock?: boolean;
}
