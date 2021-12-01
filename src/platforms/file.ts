import {
    IECheckFunction,
    IETransformFunction,
    IEDefaultPlatform
} from "../types";

import { node_create, REPLACEMENT_TOKEN } from "../helpers/nodes_helpers";
import { static_segment } from "../helpers/path_helpers";

const checker: IECheckFunction = (node_object) => {
    
    let internal = node_object?.node?.internal;
    return internal && internal.type === "File" && is_image(internal.mediaType);
};

const transformer: IETransformFunction = (node_object, options, global_options) => {
    let dist_url = options?.ie_delivery_address || global_options?.ie_delivery_address;
    let directives = options?.directives || global_options?.directives;
    let url = get_node_object_url(node_object);
    let digest = node_object?.node?.internal?.contentDigest;
    if (url && digest) {
	let final_url = `${REPLACEMENT_TOKEN}${static_segment(digest, url)}`
	
	return node_create(node_object, url, final_url, dist_url, directives, node_object?.node?.internal.mediaType);
	
    } else {
	throw `error processing file node: ${url ? "no content digest" : "unable to extract url/relative path"}`;
    }
};


const platform: IEDefaultPlatform = {
    checker: checker,
    transformer: transformer
};

export default platform;

function is_image(media_type: string | undefined): boolean {
    if (typeof media_type === "string") {
	switch(media_type.split("/")[0]) {
	    case "image":
		return true;
	    default:
		return false;
		
	}
    } else {
	return false;
    }
};


function get_node_object_url(node_object: any): string | void {
    switch(node_object?.node?.internal.type) {
	case "File":
	    return node_object.node.relativePath;
	default:
	    throw "unrecognized type of file/asset node";
    };
};
