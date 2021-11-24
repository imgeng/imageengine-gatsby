import { IEDirectives } from "@imageengine/imageengine-helpers";

type MaybeString = string | null | undefined

export function node_create(node_object: any, base_url: string, tokenized_url: string, distribution_url: MaybeString,  directives: IEDirectives, mime_type?: string | undefined) {
    let { actions, node } = node_object;
    let parent_type = node_object?.node?.internal.type;
    let is_file = parent_type === "File";
    
    let new_node = {
	id: `imgeng-${node.id}`,
	parent: node.id,
	base_url: base_url,
	tokenized_url: tokenized_url,
	distribution_url: distribution_url,
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
