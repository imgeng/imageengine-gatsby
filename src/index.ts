import {
    IEPluginOption,
    IEPluginOptions,
    IECheckFunction,
    IETransformFunction,
    IETransformObject
} from "./types";

import {
    IEFormatGraphql,
    IEFitGraphql,
    IEDirectivesGraphql
} from "./graphql";

import { default_platforms, child_ofs } from "./default_platforms";
import { url_field_resolver, gatsby_image_field_resolver, responsive_details_field_resolver } from "./resolvers";


export async function on_create_node(node: any, options: any): Promise<Node> {
    let transforms: IETransformObject[] = extract_transforms(node, options.sources, options);
    let new_node = transforms.reduce((acc_node, transform) => {
	transform.fun(acc_node, transform.opts, options);
	return acc_node;
    }, node);
    
    return new_node;
};

function extract_transforms(node: any, sources: IEPluginOption[], options: IEPluginOptions): IETransformObject[] {
    
    return sources.reduce((acc, source) => {
	let source_type, checker, transformer, opts;
	if (typeof source === "string") {
	    source_type = source;
	    checker = maybe_default_checker(source);
	    transformer = maybe_default_transform(source);
	    opts = {source: source};
	} else {
	    source_type = source.source;
	    opts = source;
	    checker = opts.checker ? opts.checker : maybe_default_checker(source_type);
	    transformer = opts.transform ? opts.transform : maybe_default_transform(source_type);
	}
	
	if (checker) {
	    if (checker(node, opts, options)) {
		if (transformer) {
		    acc.push({fun: transformer, opts: opts} as IETransformObject);
		} else {
		    raise_error("missing_transformer", source_type, opts);
		}
	    }	
	} else {
	    raise_error("missing_checker", source_type, opts);
	}

	return acc;
    }, [] as IETransformObject[]);
};

function maybe_default_checker(key: string): IECheckFunction | undefined {
    if (default_platforms[key]) {
	return default_platforms[key]?.checker;
    } else {
	return undefined;
    }
};

function maybe_default_transform(key: string): IETransformFunction | undefined {
    if (default_platforms[key]) {
	return default_platforms[key]?.transformer;
    } else {
	return undefined;
    }
};

function raise_error(type_of_error: string, key: string, opts: any) {
    switch(type_of_error) {
	case "missing_transformer":
	    throw `Unable to find transformer function for ${key}`;
	case "missing_checker":
	    throw `Unable to find checker function for ${key}`;
	default:
	    throw `Unknown type of error when processing option ${key} - ${opts}`;
    }
};


export function create_schema_customization(context: any) {
    const { createTypes } = context.actions;

    createTypes([IEFormatGraphql, IEFitGraphql]);

    const typeDefs = [
	IEDirectivesGraphql,
	context.schema.buildObjectType({
	    name: "ImageEngineAsset",
	    interfaces: ["Node"],
	    extensions: {childOf: {types: child_ofs}},
	    fields: {
		base_url: "String!",
		tokenized_url: "String!",
		ie_distribution: "String",
		replacement_token: "String",
		directives: "ImageEngineDirectives",
		url: url_field_resolver(context),
		responsive_details: responsive_details_field_resolver(context),
		gatsbyImageData: gatsby_image_field_resolver(context)
	    }
	})
    ];
    
    createTypes(typeDefs);
};

export * from "./helpers/nodes_helpers";
export * from "./helpers/path_helpers";
