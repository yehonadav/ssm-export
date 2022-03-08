import {Strategy} from "./types";
import {ISSMClient, SSMClient} from "@yehonadav/yonadav-ssm-client";
import {EnvExporter} from "./envExporter";

/***
 //////////////
 // examples //
 //////////////

const exporter = new SSMExporter({
  token: "3445675786fgnfghjg...",
  strategy: "append",
  exportTo: ["../app1/.env", "../app2/.env"] | ".env"
}

await exporter.export()
 ***/

type ExportTo = string[]|string;

export interface ISSMExporter {
  // Updates .env files
  export():Promise<void>;
}

export type SSMExporterParams = {
  token:string,
  exportTo:ExportTo,
  strategy:Strategy,
}

export type CreateExportersParams = {
  exportTo:ExportTo,
  strategy:Strategy,
}

export type ExportSSMParams<T=any> = {
  params:T,
  exportTo:ExportTo,
  strategy:Strategy,
}

export type ExportSSM = <T=any>(props:ExportSSMParams<T>) => void;

const createExporters = ({exportTo, strategy}:CreateExportersParams) => {
  return (typeof exportTo === 'string' ? [exportTo] : exportTo)
    .map(path => new EnvExporter(path, strategy));
}

export class SSMExporter implements ISSMExporter {
  readonly ssmClient: ISSMClient;
  readonly envExporters: EnvExporter[];

  constructor({token, exportTo, strategy}:SSMExporterParams) {
    this.ssmClient = new SSMClient(token);
    this.envExporters = createExporters({exportTo, strategy});
  }

  export:ISSMExporter['export'] = async () => {
    const params = await this.ssmClient.get();
    this.envExporters.forEach(env=>env.export(params));
  };
}

export const exportSSM:ExportSSM = ({params, exportTo, strategy}) => {
  const envExporters = createExporters({exportTo, strategy});
  envExporters.forEach(env=>env.export(params));
}