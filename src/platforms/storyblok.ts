import {
  IECheckFunction,
  IETransformFunction,
  IEDefaultPlatform,
} from "../types";

import { node_create, REPLACEMENT_TOKEN } from "../helpers/nodes_helpers.js";

const default_replace_url: string = "https://a.storyblok.com/";

const checker: IECheckFunction = (node_object) => {
  let internal = node_object?.node?.internal;
  const isStoryblok = internal && internal.type === "StoryblokEntry";

  if (isStoryblok) {
    let content = JSON.parse(node_object.node.content);
    return content.assets !== undefined;
  }
  return isStoryblok;
};

const transformer: IETransformFunction = (
  node_object,
  options,
  global_options
) => {
  let dist_url =
    options?.ie_delivery_address || global_options?.ie_delivery_address;
  let directives = options?.directives || global_options?.directives;
  let replace_url = options?.replace_url || default_replace_url;
  let content = JSON.parse(node_object.node.content);
  if (content.assets) {
    let filename = content.assets.filename;

    let tokenized_url = filename.replace(replace_url, REPLACEMENT_TOKEN);
    return node_create(
      node_object,
      filename,
      tokenized_url,
      dist_url,
      directives,
      node_object?.node?.internal.mediaType
    );
  }
  return null;
};

const platform: IEDefaultPlatform = {
  checker: checker,
  transformer: transformer,
};

export default platform;
