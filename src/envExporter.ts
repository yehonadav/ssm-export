import fs from "fs";
import os from "os";
import {Strategy} from "./types";
// import path from "path";

// const envFilePath = path.resolve(__dirname, ".env");

/***
 //////////////
 // examples //
 //////////////

 let env:IEnvExport;

 env = new EnvExport('.env', 'append');
 console.log(env.get());
 env.export({'KEY_1': 'value 1'});
 console.log(env.get());
 env.export({'KEY_1': 'value 10000000000000000'});
 console.log(env.get());
 env.export({});
 console.log(env.get());

 env = new EnvExport('.env', 'appendOverride');
 console.log(env.get());
 env.export({'KEY_1': 'value 100'});
 console.log(env.get());
 env.export({});
 console.log(env.get());

 env = new EnvExport('.env', 'write');
 console.log(env.get());
 env.export({KEY_1: 'value 1000', key3: '345', key4: '678'});
 console.log(env.get());
 env.export({key3: '345', key4: '678'});
 console.log(env.get());
 env.export({});
 console.log(env.get());
 env.export({123: 345, 'true': false, 'null': null});
 console.log(env.get());
***/

export interface IEnvExporter {
  // read .env file & convert to array
  read(): string;

  // parse .env file and return an object
  parse(value:string):Record<string, string>;

  // read & parse
  get():Record<string, string>;

  // Updates .env file
  export(params:any):void;
}

export class EnvExporter implements IEnvExporter {
  readonly path: string;
  readonly strategy: Strategy;

  constructor(envFilePath:string, strategy:Strategy) {
    this.path = envFilePath;
    this.strategy = strategy;
  }

  read:IEnvExporter['read'] = () => {
    if (!fs.existsSync(this.path))
      return "";

    return fs.readFileSync(this.path, "utf-8");
  }

  parse:IEnvExporter['parse'] = (value:string) =>
    value.split(os.EOL).reduce((obj, line) => {
      const [key, value] = line.split("=", 2);
      if (key && value)
        obj[key] = value;
      return obj;
    }, {} as ReturnType<IEnvExporter['parse']>);

  get = () => this.parse(this.read());

  write = (obj:any) => {
    const lines:string[] = [];
    for (const key in obj)
      lines.push(`${key}=${obj[key]}`);

    // write everything back to the file system
    fs.writeFileSync(this.path, lines.join(os.EOL));
  }

  append = (params:any) => {
    const obj = this.get();
    Object.assign(params, obj);
    this.write(params);
  }

  appendOverride = (params:any) => {
    const obj = this.get();
    Object.assign(obj, params);
    this.write(obj);
  }

  export:IEnvExporter['export'] = (params) => {
    this[this.strategy](params);
  };
}
