# gatsby-plugin-imageengine

This is a plugin for [GatsbyJS](https://www.gatsbyjs.com) that allows you to seamlessly integrate ImageEngine into your Gatsby workflow.

It includes functionality to make it easy to use external CMS (e.g.: `Contentful`, `Sanity.io`), static `File` assets created through `gatsby-plugin-filesystem`, and others, allowing it them to be used directly with `Gatsby` components such as `GatsbyImage`.
Helpers to build your own urls and ImageEngine related functionality along with components are also exposed in order to provide flexibility in our you organise your assets and how you deal with including them in your final webpages/content.


## Index:
[Installation](#installation)
<br/>
[Usage](#usage)
- [ImageEngineAsset](#imageengineasset)
- [Contentful](#contentful)
- [Sanity.IO](#sanity-io)
- [File](#file)
- [Custom](#custom-nodes)

### Installation

You need to install the package on your npm project.

```bash
npm install @imageengine/gatsby-plugin-imageengine
```

### Usage

To use the component you define on your `gatsby-config.js` the plugin, under the `plugins` key an object with the `resolve` key pointing to the package name and an `options` key containing at least a `sources` key with an array of sources you want to use.

```json
plugins: [
	   // ... other plugins
	   {
		 resolve: "@imageengine/gatsby-plugin-imageengine",
		 options: {
		   sources: [
		     {
		       source: "contentful",
		       ie_distribution: "https://some-ie-url.cdn.imgeng.in/"
		     },
		     {
		       source: "sanityio",
		       ie_distribution: "https://another-ie-url.cdn.imgeng.in/"
		     },
		     {source: "file"}
		   ],
		   ie_distribution: "https://yet-another-ie-url.cdn.imgeng.in/"
	    	 }
	  }
]
```

Most of these plugins on their turn require using additional plugins, exemplified further down one-by-one.

#### ImageEngineAsset

How does it work? This plugin automatically creates child `ImageEngineAsset` nodes when using supported sources. This means you can use `graphql` to access these nodes and those contain all you need to use `GatsbyImage` or get an `ImageEngine` url. E.g.:

```javascript
const Lightbox = () => {
    const data = useStaticQuery(graphql`

      query {
        allContentfulAsset {
          nodes {
            childImageEngineAsset {
              gatsbyImageData(width: 500, height: 300, compression: 10)
            }
          }
        }
      }`);
    
    return (
      <div class="light-box">
        {data.allContentfulAsset.childImageEngineAsset.map(({ gatsbyImageData }, index) => {
	  return <GatsbyImage key={`image-${index}`} image={gatsbyImageData} />;
	})}
      </div>
    );
}
```

Built-in sources supported by the plugin automatically include `Contentful`, `Sanity.io` and `File` assets. In these cases you just need to define an object inside the `sources` key with the `source` and `ie_distribution` (e.g.: `{source: "contentful", ie_distribution: "fully-qualified-url-for-your-imageengine-cdn-address}`).

You can also set a global ImageEngine cdn at the top level of the `options` object, with the key `ie_distribution` and in this case, `sources` that don't specify their own will use that. Between both, at least one has always to be set. It might be useful to use a global one if different sources use the same cdn address for some reason.

In the example above, `contentful` will use the `ie_distribution` address of `https://0y0v1j5p.cdn.imgeng.in/`, `sanityio` in turn will use `https://lot61nw1.cdn.imgeng.in/` and the `File` assets will default to `https://53bEvX1a.cdn.imgeng.in/`. This means you can create multiple `engines` in `ImageEngine` and use them easily in the same `Gatsby` project.

Remember to use the trailing slash on your `ie_distribution` values.

#### Contentful

For `contentful` functionality to work you'll need to use [gatsby-source-contentful](https://www.gatsbyjs.com/plugins/gatsby-source-contentful/).

With that in place `Gatsby` will create Graphql Nodes for your Contentful elements. When an element is of the type `ContentfulAsset` we'll create a child node of `ImageEngineAsset` under it, that you can access. 

#### Sanity.IO

For `sanityio` you'll need to use [gatsby-source-sanity](https://www.gatsbyjs.com/plugins/gatsby-source-sanity/)


#### File

For `File` assets you'll need to use [gatsby-source-filesystem](https://www.gatsbyjs.com/plugins/gatsby-source-filesystem/)

In this particular case, since it relies on static files, it will follow the same logic of using `File` assets with that plugin. In the `filesystem` plugin a file is only made available in the final build, if somewhere you query for the `publicURL` field of that file node. This plugin mimics that so for the final assets to be copied over to your build `static` folder, somewhere you'll need to query at least once for those `ImageEngineAssets` either the `gatsbyImageData` or `url` fields so that those files are copied over to static. This is important, because if you don't, then these files won't be available on your final build, and as such, when using the `ImageEngine` cdn address it won't be able to retrieve them. 

An example would be:

```graphql
allFile {
  nodes {
    childImageEngineAsset {
      url(width: 500, height: 300, compression: 10)
    }
  }
}
```

#### Custom Nodes

For types of sources for which you have no plugin available you can write your own bridge functions that enable creating `ImageEngineAsset` nodes.

In order to do that your `source` object has to specify both a `checker` function and a `transform` function.

```typescript
export type IECheckFunction = (node: any, options?: IEPluginOption, global_options?: IEPluginOptions) => boolean;
export type IETransformFunction = (node: any, options?: IEPluginOption, global_options?: IEPluginOptions) => void;
```

Support for a custom source could then be implemented with:

```javascript
{
  resolve: "@imageengine/gatsby-plugin-imageengine",
  options: {
    sources: [
      {
        source: "my-own-source",
	ie_distribution: "https://some-url.cdn.imgeng.in/",
	checker: my_own_source_checker,
        transform: my_own_transform
      }
    ]
  }
}
```

And then your checker function would be for instance:

```typescript
import { IECheckFunction } from "@imageengine/gatsby-plugin-imageengine";
const checker: IECheckFunction = (node_object) => {
    
    let internal = node_object?.node?.internal;
    return internal && internal.type === "SomeNodeType"
};

export checker;
```

And your transform:

```typescript
import { IETransformFunction, node_create, REPLACEMENT_TOKEN } from "@imageengine/gatsby-plugin-imageengine";

const transformer: IETransformFunction = (node_object, options, global_options) => {
    let dist_url = options?.ie_distribution || global_options?.ie_distribution;
    let directives = options?.directives || global_options?.directives;
    let replace_url = "https://some-cms-address/";
    let { url, contentType } = node_object.node.my_node_details;
    let tokenized_url = url.replace(replace_url, REPLACEMENT_TOKEN);

    return node_create(node_object, url, tokenized_url, dist_url, directives, contentType);
};

export transformer;
}
```

`node_object` is the parent object for which the `checker` function returns true.
`options` are the specific options of the `source` object that specify this type of asset.
`global_options` are the full options passed to the `gatsby-plugin-imageengine` 

When you're inside your `transformer` function you know this particular node returned true for your `checker` function.

Ultimately you need to call `node_create` with this `node` (which will be the parent), the default original url, a tokenized url (which is a url with a specific token for replacement that you need to use), the `ImageEngine Engine` distribution address, any default directives and optionally a mimeType.

```typescript
function node_create(node_object: any, base_url: string, tokenized_url: string, distribution_url: MaybeString,  directives: IEDirectives, mime_type?: string | undefined)
```

In this particular case, lets imagine your node is an asset in some CMS and has a `url` field that contains the address to that asset. We replace the portion of the CMS address from the URL with the given token (imported from `gatsby-plugin-imageengine`) and use that as the `tokenized_url` and the original url as the `base_url`.
This way the plugin will know how to retrieve the final correct url for your asset in the `ImageEngine Engine` distribution.

