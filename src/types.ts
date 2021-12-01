export type IECheckFunction = (node: any, options?: IEPluginOption, global_options?: IEPluginOptions) => boolean;
export type IETransformFunction = (node: any, options?: IEPluginOption, global_options?: IEPluginOptions) => void;

export interface IEPluginOption {
    source: string,
    ie_delivery_address?: string,
    replace_url?: string,
    checker?: IECheckFunction,
    transform?: IETransformFunction,
    directives?: any
};

export interface IEPluginOptions {
    sources: IEPluginOption[],
    ie_delivery_address?: string,
    directives?: {[key: string]: any}
};

export interface IETransformObject {
    fun: IETransformFunction,
    opts: IEPluginOption
};

export interface IEDefaultPlatform {
    checker: IECheckFunction,
    transformer: IETransformFunction
};

export interface IEDefaultPlatforms {
    [key: string]: IEDefaultPlatform
};
