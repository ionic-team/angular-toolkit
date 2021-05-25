export interface Schema {
  path?: string;
  project?: string;
  name: string;
  prefix?: string;
  styleext?: string;
  skipTests?: boolean;
  flat?: boolean;
  selector?: string;
  module?: string;
  routePath?: string;
}
