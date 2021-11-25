import { generateImageData } from "gatsby-plugin-image";

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
    IEDirectivesGraphql,
    IEDirectivesGraphqlObject
} from "./graphql";

import { default_platforms, child_ofs } from "./default_platforms";
import { build_IE_url, OBJECT_TO_DIRECTIVES_MAP } from "@imageengine/imageengine-helpers";
import { static_path_from_source, static_segment } from "./helpers/path_helpers";

const fs = require("fs-extra");


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
		distribution_url: "String",
		replacement_token: "String",
		directives: "ImageEngineDirectives",
		url: {
		    type: "String",
		    args: IEDirectivesGraphqlObject,
		    resolve(source: any, args: any) {
			maybe_build_static_file_dependency(source, context);
			return ie_image_resolver(source, args);
		    } 
		},
		gatsbyImageData: {
		    // these types for the args where copied over from:
		    // https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-image/src/resolver-utils.ts
		    // the reason is, they have a helper that builds this resolver
		    // automatically, but when using that we don't have the context
		    // and access to functions such as getNodeAndSavePathDependency
		    // which then means we wouldn't be able to copy the static
		    // dependency file and link it as their `buildURL` does for
		    // `File` nodes. So we end up doing what that helper would do
		    // but extended with our args specific for IE, and then we 
		    // pass the context that contains getNodeAndSave... to the
		    // resolves and we can then set up the link
		    type: "JSON!",
		    args: {
			layout: {
			    type: "GatsbyImageLayout",
			    description: "The layout for the image. FIXED: A static image sized, that does not resize according to the screen width FULL_WIDTH: The image resizes to fit its container. Pass a 'sizes' option if it isn't going to be the full width of the screen. CONSTRAINED: Resizes to fit its container, up to a maximum width, at which point it will remain fixed in size.",
			},
			aspectRatio: {
			    type: "Float",
			    description: "If set along with width or height, this will set the value of the other dimension to match the provided aspect ratio, cropping the image if needed. If neither width or height is provided, height will be set based on the intrinsic width of the source image.",
			},
			sizes: {
			    type: "String",
			    description: "The 'sizes' property, passed to the img tag. This describes the display size of the image. This does not affect the generated images, but is used by the browser to decide which images to download. You can leave this blank for fixed images, or if the responsive image container will be the full width of the screen. In these cases we will generate an appropriate value.",
			},
			outputPixelDensities: {
			    type: "[Float]",
			    description: "A list of image pixel densities to generate for FIXED and CONSTRAINED images. You should rarely need to change this. It will never generate images larger than the source, and will always include a 1x image. Default is [ 1, 2 ] for fixed images, meaning 1x, 2x, 3x, and [0.25, 0.5, 1, 2] for fluid. In this case, an image with a fluid layout and width = 400 would generate images at 100, 200, 400 and 800px wide. Ignored for FULL_WIDTH, which uses breakpoints instead.",
			},
			breakpoints: {
			    type: "[Int]",
			    description: "Specifies the image widths to generate. You should rarely need to change this. For FIXED and CONSTRAINED images it is better to allow these to be determined automatically, based on the image size. For FULL_WIDTH images this can be used to override the default, which is determined by the plugin. It will never generate any images larger than the source.",
			},
			backgroundColor: {
			    type: "String",
			    description: "Background color applied to the wrapper, or when 'letterboxing' an image to another aspect ratio.",
			},
			...IEDirectivesGraphqlObject
		    },
		    resolve(source: any, args: any) {
			maybe_build_static_file_dependency(source, context);
			return gatsby_image_resolver(source, args);
		    }
		}
	    }
	})
    ];
    
    createTypes(typeDefs);
};


function directives_args(source: any, args: any): {[key: string]: any} {
    let source_directives = source.directives || {};
    let args_directives = args || {};
    let merged_directives = Object.assign(source_directives, args_directives);
    return Object.keys(OBJECT_TO_DIRECTIVES_MAP).reduce((acc, key) => {
	let directive = merged_directives[key];
	if (directive) {
	    acc[key] = directive;
	}
	return acc;
    }, {} as {[key: string]: any});
};


function ie_image_resolver(source: any, args: any) {
    let url = ie_replace_url(source, args);
    let final_directives = directives_args(source, args);
    
    return build_IE_url(url, final_directives);
};

function ie_replace_url(source: any, args: any): string {
    // if the parent node is a `File` and we're not in production, or building
    // for production, then we don't want to return the IE address for the asset
    // yet, since we might not have an IE distribution yet either so we return
    // the base_url that will point to a local file, in order for it to work
    // seamlessly while in local dev.
    if (source.parent_type === "File" && process.env["NODE_ENV"] !== "production") {
	return static_segment(source.internal.contentDigest, source.base_url);
    } else {
	let token = source.replacement_token;
	let distribution = args.distribution_url || source.distribution_url;
	return source.tokenized_url.replace(token, distribution);
    }
};

function gatsby_image_resolver(source: any, args: any): any {

    let with_source_args = directives_args(source, args);
    let full_args = Object.assign(args || {}, with_source_args);
    let url = ie_replace_url(source, full_args);
    
    let source_metadata = {
	width: source.width || with_source_args["width"],
	height: source.height || with_source_args["height"],
	format: source.internal.mediaType.split("/")[1]
    };

    let image_data_args = {
	...full_args,
	options: full_args,
	sourceMetadata: source_metadata,
	placeholderURL: null,
	pluginName: "@imageengine/gatsby-plugin-imageengine",
	filename: url,
	generateImageSource: ie_from_gatsby_image_resolver
    };

    return generateImageData(image_data_args);
};

function ie_from_gatsby_image_resolver(url: string, width: any, height: any, format: any, fit: any, args: any) {
    width = width || args.width;
    height = height || args.height;
    format = format || args.format;
    let final_args = {
	...args,
	width,
	height,
	format,
	fit
    };

    return {src: build_IE_url(url, final_args), width, height, format};
};

/*
this logic is taken from:
https://github.com/gatsbyjs/gatsby/blob/56acfe1674b02740d2c05979be39b1144eacc42f/packages/gatsby-source-filesystem/src/extend-file-node.js
note that getNodeAndSave... is on the ctx that's why we need to pass down the ctx
from the resolver.
If the parent node is a `File` and somewhere in the client (the developer using 
gatsby-plugin-imageengine) code we call either `url` or `gatsbyImageData` on an
`ImageEngineAsset` node then we know that we need to copy the file to static
so that when the site is built it's actually copied over to the final build.
This is the way `gatsby-plugin-filesystem` works, in that if `publicURL` is called
it does exactly this. Would be great if gatsby would expose this logic as a function
so that other plugins could use and they remained the same and in sync, since it 
doesn't, we just copy their implementation for now.
The only change is in our we implement the `static` part with the digest in that
we don't intersperse the digest on the asset file name, e.g.: `some-name-${digest}.extension`, and instead make a path `/${digest}/some-name.extension`.
Changing that means changing the `static_path_from_source` (actually the static 
building part in the same file), and when changed there then `file.ts` platform that
builds File info will also use the same function and as such be in synch.
*/
function maybe_build_static_file_dependency(source: any, ctx: any): void {
    if (source.parent_type === "File") {
	let file = ctx.getNodeAndSavePathDependency(source.parent, source.parent_path);
	let public_path = static_path_from_source(source)

	if (!fs.existsSync(public_path)) {
	    // @ts-ignore
            fs.copy(file.absolutePath, public_path, err => {
		if (err) {
		    console.error(
			`error copying file from ${file.absolutePath} to ${public_path}`,
			err
		    )
		}
            })
	}
    }	
};