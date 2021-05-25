export interface Schema {
  path?: string;
  project?: string;
  name: string;
  prefix?: string;
  styleext?: string;
  skipTests?: boolean;
  flat?: boolean;
  selector?: string;
  createModule?: boolean;
  module?: string;
  export?: boolean;
  entryComponent?: boolean;
}
