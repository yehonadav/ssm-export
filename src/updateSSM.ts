import {BaseEnvironment, ENV, Strategy} from "./types";
import {exportSSM} from './ssmExporter';
import {SSMClient} from "@yehonadav/yonadav-ssm-client";

const handleEnvExport = <Environment extends BaseEnvironment>(
  params:Environment,
  strategy: Strategy,
  exportToDirs:string[],
) => {
  console.log({STAGE: params.STAGE, message: "exporting env"});
  const filename = `.env.${params.STAGE}`;
  exportSSM({
    params,
    strategy,
    exportTo: exportToDirs.map(path=>`${path}/${filename}`),
  });
}

const handleUndefinedEnvValue = async <Environment extends BaseEnvironment>(env:ENV<Environment>, strategy:Strategy, exportToDirs:string[]) => {
  console.log({STAGE: '???', message: "env is not defined, getting ssm params"});
  const ssmClient = new SSMClient(env.token);
  const params:Environment = await ssmClient.get();
  handleEnvExport(params, strategy, exportToDirs);
}

const handleDefinedEnvValue = async <Environment extends BaseEnvironment>(env:ENV<Environment>, strategy:Strategy, exportToDirs:string[]) => {
  const envValue = env.value as Environment;

  ////////////////////
  // get ssm params //
  ////////////////////

  console.log({STAGE: envValue.STAGE, message: "get ssm params"});
  const ssmClient = new SSMClient(env.token);
  const params:Environment = await ssmClient.get();

  ///////////////////////////////
  // update new/changed fields //
  ///////////////////////////////

  const diffPut = (Object.keys(envValue) as (keyof typeof envValue)[])
    .reduce((r, k) => {
      if (envValue[k] !== undefined && envValue[k] !== params[k])
        r[k] = envValue[k];
      return r;
    }, {} as Partial<typeof envValue>);

  if (Object.keys(diffPut).length > 0) {
    console.log({STAGE: envValue.STAGE, message: `updating params: [${Object.keys(diffPut).join(', ')}]`});
    // @ts-ignore
    await ssmClient.edit(diffPut);
  }

  ///////////////////////////
  // update deleted fields //
  ///////////////////////////

  const delKeys: string[] = [];
  for (const k in params)
    // @ts-ignore
    if (env.value[k] === undefined)
      delKeys.push(k);

  if (delKeys.length > 0) {
    console.log({STAGE: envValue.STAGE, message: `removing params: [${delKeys.join(', ')}]`});
    await ssmClient.remove(delKeys);
  }

  /////////////////////////
  // export env to files //
  /////////////////////////
  handleEnvExport(envValue, strategy, exportToDirs);
}

export type UpdateSSMProps<Environment extends BaseEnvironment> = {
  exportToDirs:string[],
  envs:ENV<Environment>[],
  strategy?:Strategy,
  sync?:boolean,
}

export type UpdateSSM = <Environment extends BaseEnvironment>(options:UpdateSSMProps<Environment>) => Promise<void>;

export const updateSSM:UpdateSSM = async (
  {
    envs,
    exportToDirs,
    sync=true,
    strategy="appendOverride",
  }) => {
  for (const env of envs) {
    if (sync) {
      if (env.value === undefined) {
        await handleUndefinedEnvValue(env, strategy, exportToDirs);
        continue;
      }
      await handleDefinedEnvValue(env, strategy, exportToDirs);
      continue;
    }
    if (env.value) {
      handleEnvExport(env.value, strategy, exportToDirs);
    } else {
      console.warn("environment is undefined");
    }
  }
}