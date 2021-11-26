import { IEDirectives } from "@imageengine/imageengine-helpers";

type MaybeString = string | null | undefined

export function node_create(node_object: any, base_url: string, tokenized_url: string, ie_distribution: MaybeString,  directives: IEDirectives, mime_type?: string | undefined) {
    let { actions, node } = node_object;
    let parent_type = node_object?.node?.internal.type;
    let is_file = parent_type === "File";
    let clean_distribution = ie_distribution ? ie_distribution.replace(/\/+$/, "") : ""
    let clean_tokenized = tokenized_url ? tokenized_url.replace(REPLACEMENT_CLEAN_REGEX, REPLACEMENT_W_TRAILING) : "";

    let new_node = {
	id: `imgeng-${node.id}`,
	parent: node.id,
	base_url: base_url,
	tokenized_url: clean_tokenized,
	ie_distribution: clean_distribution,
	directives: directives,
	replacement_token: REPLACEMENT_TOKEN,
	parent_type: parent_type,
	parent_path: is_file ? node_object?.node?.absolutePath : null,
	parent_filename: is_file ? node_object?.node?.name : null,
	internal: {
	    mediaType: mime_type || node.internal.mediaType,
	    type: "ImageEngineAsset",
	    contentDigest: node.internal.contentDigest,
	    description: "Image Engine Asset definition"
	}
    };
    
    actions.createNode(new_node);
    actions.createParentChildLink({parent: node, child: new_node});

    return new_node;
};

export const REPLACEMENT_TOKEN = "##::__IE__::##";
export const REPLACEMENT_W_TRAILING = `${REPLACEMENT_TOKEN}/`;
export const REPLACEMENT_CLEAN_REGEX = new RegExp("\\\#\\\#\\\:\\\:__IE__\\\:\\\:\\\#\\\#\\\/{0,}");
