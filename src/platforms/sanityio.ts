import {
    IECheckFunction,
    IETransformFunction,
    IEDefaultPlatform
} from "../types";

import { node_create, REPLACEMENT_TOKEN } from "../helpers/nodes_helpers.js";

const default_replace_url: string = "https://cdn.sanity.io/";

const checker: IECheckFunction = (node_object) => {
    
    let internal = node_object?.node?.internal;
    return internal && internal.type === "SanityImageAsset"
};

const transformer: IETransformFunction = (node_object, options, global_options) => {
    let dist_url = options?.ie_delivery_address || global_options?.ie_delivery_address;
    let directives = options?.directives || global_options?.directives;
    let replace_url = options?.replace_url || default_replace_url;
    let { url, mimeType } = node_object.node;
    let tokenized_url = url.replace(replace_url, REPLACEMENT_TOKEN);
    return node_create(node_object, url, tokenized_url, dist_url, directives, mimeType);
};


const platform: IEDefaultPlatform = {
    checker: checker,
    transformer: transformer
};

export default platform;
