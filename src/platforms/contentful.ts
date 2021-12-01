import {
    IECheckFunction,
    IETransformFunction,
    IEDefaultPlatform
} from "../types";

import { node_create, REPLACEMENT_TOKEN } from "../helpers/nodes_helpers.js";

const default_replace_url: string = "//images.ctfassets.net/";

const checker: IECheckFunction = (node_object) => {
    
    let internal = node_object?.node?.internal;
    return internal && internal.type === "ContentfulAsset"
};

const transformer: IETransformFunction = (node_object, options, global_options) => {
    let dist_url = options?.ie_delivery_address || global_options?.ie_delivery_address;
    let directives = options?.directives || global_options?.directives;
    let replace_url = options?.replace_url || default_replace_url;
    let { url, contentType } = node_object.node.file;
    let tokenized_url = url.replace(replace_url, REPLACEMENT_TOKEN);

    return node_create(node_object, url, tokenized_url, dist_url, directives, contentType);
};


const platform: IEDefaultPlatform = {
    checker: checker,
    transformer: transformer
};

export default platform;
