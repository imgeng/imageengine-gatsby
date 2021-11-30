# gatsby-plugin-imageengine

This is a plugin for [GatsbyJS](https://www.gatsbyjs.com) that allows you to seamlessly integrate ImageEngine into your Gatsby workflow.

It includes functionality to make it easy to use external CMS (e.g.: `Contentful`, `Sanity.io`), static `File` assets created through `gatsby-plugin-filesystem`, and others, allowing them to be used directly with `Gatsby` components such as `GatsbyImage` and `ImageEngine engines`.
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

<br/>

[Directives](#directives)
- [Global Configuration](#configuring-global-directives)
- [Query Directives](#query-directives)
- [Formats](#formats)
- [Graphql Resolvers](#graphql-imageengine-aware-resolvers)
- [url Resolver](#url-resolver)
- [gatsbyImageData Resolver](#gatsbyimagedata-resolver)
- [responsive_details Resolver](#responsive_details-resolver)

<br/>

[React Component](#react-component)
<br/>

[Plain URLs without Graphql](#plain-urls-without-graphql)

### Installation

You need to install the package on your npm project.

```bash
npm install @imageengine/gatsby-plugin-imageengine
```

### Usage

To use the component you define on your `gatsby-config.js` the plugin, under the `plugins` key an object with the `resolve` key pointing to the package name and an `options` key containing at least a `sources` key with an array of sources you want to use.

```javascript
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

Most of these plugins on their turn require using additional plugins, including `gatsby-plugin-image`.


#### ImageEngineAsset

How does it work? This plugin automatically creates child `ImageEngineAsset` nodes when using supported sources. This means you can use `graphql` to access these nodes and those contain all you need to use `GatsbyImage` or get an `ImageEngine` url. E.g.:

```javascript
import { GatsbyImage } from "gatsby-plugin-image";
import { useStaticQuery, graphql } from "gatsby";

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

In the example above, `contentful` will use the `ie_distribution` address of `https://some-ie-url.cdn.imgeng.in/`, `sanityio` in turn will use `https://another-ie-url.cdn.imgeng.in/` and the `File` assets will default to `https://yet-another-ie-url.cdn.imgeng.in/`. This means you can create multiple `engines` in `ImageEngine` and use them easily in the same `Gatsby` project.

#### Contentful

For `contentful` functionality to work you'll need to use [gatsby-source-contentful](https://www.gatsbyjs.com/plugins/gatsby-source-contentful/).

With that in place `Gatsby` will create Graphql Nodes for your Contentful elements. When an element is of the type `ContentfulAsset` we'll create a child node of `ImageEngineAsset` under it, that you can access through graphql. 

You need to have an `ImageEngine Engine` pointing to `Contentful`'s CDN and use that address as your `ie_distribution`.

#### Sanity.IO

For `sanityio` you'll need to use [gatsby-source-sanity](https://www.gatsbyjs.com/plugins/gatsby-source-sanity/)

The same as with `contentful`, an `ImageEngineAsset` node is created as a child node.

You need to have an `ImageEngine Engine` pointing to `Sanity`'s CDN and use that address as your `ie_distribution`.

#### File

For `File` assets you'll need to use [gatsby-source-filesystem](https://www.gatsbyjs.com/plugins/gatsby-source-filesystem/)

In this particular case, since it relies on static files, it will follow the same logic of using `File` assets with that plugin - you **cannot** use `StaticImage` with this plugin (read below). 

In the `filesystem` plugin a file is only made available in the final build, if somewhere you query for the `publicURL` field of that file node. This plugin mimics that so for the final assets to be copied over to your build `static` folder, somewhere you'll need to query at least once for those `ImageEngineAssets` either the `gatsbyImageData` or `url` fields so that those files are copied over to static. This is important, because if you don't, then these files won't be available on your final build, and as such, when using the `ImageEngine` cdn address it won't be able to retrieve them. 

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

Even if you know your image is static at build time, you need to use `GatsbyImage` instead of `StaticImage`. `StaticImage` will try to download the asset at build time to process and create its `sharp` variants, but the `URL` for "production" (when building) will be the URL of `ImageEngine`'s CDN, so it won't exist until it's deployed, but because the build will fail to download the image, the CDN will not be able to mirror the file.

If you use the `gatsby-source-filesystem` plugin with a config of:
```javascript
{
  resolve: `gatsby-source-filesystem`,
  options: {
    name: `images`,
    path: `${__dirname}/src/images/`,
  },
}
```

And say you have a `main-page-header.jpg`, you can use it on a `GatsbyImage` by doing:

```javascript
import * as React from "react";
import { GatsbyImage } from "gatsby-plugin-image";
import { useStaticQuery, graphql } from "gatsby";

const IndexPage = () => {
  const data = useStaticQuery(graphql`
    query {
      file(base: {eq: "main-page-header.jpg"}) {
        childImageEngineAsset {
	  gatsbyImageData(width: 500, height: 300, compression: 10)
	}
      }
    }`);

  return (
    <main>
      <h1>Some header</h1>
      <GatsbyImage image={data.file.childImageEngineAsset.gatsbyImageData} />
    </main>
  );
};
```

While developing the image will be retrieved from your static path, and when building for production the url will be pointing to your `ImageEngine` distribution path with the directives passed on the `gatsbyImageData` field query. In this case `width`, `height` (also used by the `GatsbyImage` component) and `compression` which is unique to `ImageEngine`.

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

### Directives

`ImageEngine` uses what is called `directives` to define specific output details of images you want to optimize. 

To see all possible directives and their values [@imageengine/imageengine-helpers](https://www.npmjs.com/package/@imageengine/imageengine-helpers)

`@imageengine/imageengine-helpers` is a dependency on this package and you might use any of the types or helpers there included as well if needed.

There's two ways of specifying directives and both can be used together. You can define specific directives as defaults on the configuration, and/or specify them when querying through `graphql`.

#### Configuring Global Directives

For the configuration you can both set them at a global level for all `sources` and individually for each `source`. On your `gatsby-node.js`, in the `@imageengine/gatsby-plugin-imageengine` configuration options

```javascript
options: {
  sources: [
    {
      source: "contentful",
      ie_distribution: "https://some-ie-url.cdn.imgeng.in/",
      directives: {
        format: "png",
	compression: 5,
	fit: "box"
      }
    },
    {
      source: "sanityio",
      ie_distribution: "https://another-ie-url.cdn.imgeng.in/"
    },
    {source: "file"}
  ],
  ie_distribution: "https://yet-another-ie-url.cdn.imgeng.in/",
  directives: {
    format: "jpg",
    sharpness: 5,
    fit: "cropbox"
  }
}
```

This means that assets for `Contentful` would have the default directives applied to each node automatically of `{format: "png", compression: 5, sharpness: 5, fit: "box"}` and all remaining ones `{format: "jpg", sharpness: 5, fit: "cropbox"}`.

#### Query Directives

These are specified when querying for the specific `ImageEngineAsset` fields:

```javascript
url(width: 500, height: 300, compression: 10, format: gif, fit: cropbox, sharpness: 30)
```

The individual directives are applied on top of any global ones, and, ultimately, query level ones applied over any other. Basically the precedence is `query directives -> source default directives -> global default directives`.
Besides the normal directives you can "override" the distribution address set in the config by using:

```javascript
url(width: 500, height: 300, compression: 10, format: gif, fit: cropbox, sharpness: 30, ie_distribution: "https://some-dist.com/")
```

Notice that `gatsbyImageData` accepts in addition to the `ImageEngine` directives, the normal `arguments` for it, such as `formats`, `sizes`, `placeholders`, etc. Refer to the [gatsby-plugin-image](https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-plugin-image/).

#### Formats

There's 2 ways of specifying formats. `ImageEngine engines` serve by default the best format the device requesting the image can handle, unless explicitly told to use a given format. `GatsbyImage` on the other hand as a tighter integration with `sharp` in order to provide that sort of functionality natively in `Gatsby` by specifying multiple sources by default.

In order to provide a more natural query and resulting picture/sources for those used to `ImageEngine` capabilities the default `formats` for the `gatsbyImageData` resolver is `[""]`, instead of the usual `["", "webp"]`. 

On a `gatsbyImageData` query, you can specify either `format` or `formats`. `format` when specified overrides `formats`. `formats` when specified generates variations on the `sources` when included in a `GatsbyImage` component. Notice that both `format` and `formats` (as well as `fit`) are `Graphql`s `enum`s and not strings.

To illustrate the differences you can refer to the following examples:

`gatsbyImageData(width: 500, height: 300)`

No `format`, nor `formats` specified. `GatsbyImage` will render a `picture` element, with an `img` tag and a `single` source. The `ImageEngine` urls won't contain the `format` directive.

`gatsbyImageData(width: 500, height: 300, format: jpg)`

`format` specified. `GatsbyImage` will render a `picture` element, with an `img` tag and a `single` source. The `ImageEngine` urls will contain the `format` directive for `jpeg`.

`gatsbyImageData(width: 500, height: 300, formats: [JPG])`. 

`formats` specified with a single type. `GatsbyImage` will render a single `img` tag, with `srcset` and `sizes`. The `ImageEngine` urls will contain the `format` directive for `jpeg`.

`gatsbyImageData(width: 500, height: 300, formats: [NO_CHANGE, WEBP])`

`formats` specified with  two types, the original (`NO_CHANGE`) and `WEBP`. `GatsbyImage` will render a `picture` element, with an `img` tag, and two `sources`. One for the original and other for the `webp` version. The `source` urls for the `NO_CHANGE` format (the original) won't have a `format` directive, while the `WEBP` source will.

`gatsbyImageData(width: 500, height: 300, formats: [JPG, WEBP])`

`formats` specified with  two types, the `JPG` and `WEBP`. `GatsbyImage` will render a `picture` element, with an `img` tag, and one `source`. The `img` tag will have the attributes of the `JPG` version and the `source` for the `webp` version. 
All urls generated will have the `format` directive applied, respectively `/f_jpeg` and `/f_webp`.

#### Graphql ImageEngine aware resolvers

The `ImageEngineAsset` nodes created by `gatsby-plugin-imageengine` expose three resolver fields that accept directives.

- url
- gatsbyImageData
- responsive_details


##### url resolver
`url` returns a simple url, correctly prefixed for the configured `ImageEngine engine` distribution for the given source. This is useful if you want to place the `url` directly in an `img` tag `src` attribute, pass it as a prop to some component, make a link, or for instance as a `background-image` on a CSS selector. 

Let's say you're integrating with `Contentful` and you have an `ImageEngine engine` configured for that `Contentful` source. Now you want to use the `ImageEngine` assets with specific quality and output settings. You can query for your `Contentful` node(s) in the same way as before, and include its `childImageEngineAsset`'s `url` field, for instance:

```javascript
query {
  allContentfulAsset {
    nodes {
      childImageEngineAsset {
        url(width: 500, height: 300, compression: 10, format: gif, fit: cropbox, sharpness: 30)
      }
    }
  }
}
```

Assuming you configured your `Contentful` source `ie_distribution` with `https://some-ie.cdn.imgeng.in/` your returned `Contentful` assets would have a structure of:

```javascript
{
  data: {
    allContentfulAsset: {
      nodes: [
        {
	  childImageEngineAsset: {
	    url: "https://some-ie.cdn.imgeng.in/skyr7ajehjkl/2BRg1oQsnOfNtA5KeDgRMh/844c4abe68cb56ec157aa906d98fe487/file-name.jpg?imgeng=/w_500/h_300/f_gif/m_cropbox/cmpr_10/s_30"
	  }
	},
	// other nodes
      ]
    }
  }
}
```

##### gatsbyImageData resolver

The `gatsbyImageData` field is in all forms similar to the `url` but it also accepts the additional properties specific to the `GatsbyImage` component. Your query instead would look like:

```javascript
query {
  allContentfulAsset {
    nodes {
      title
      childImageEngineAsset {
        gatsbyImageData(width: 500, height: 300, compression: 10, format: gif, fit: cropbox, sharpness: 30)
      }
    }
  }
}
```

Now you can use the returned value in a `GatsbyImage` element, allowing you to use all the inbuilt functionality of that component, such as having the `srcset`, `sizes` and other useful attributes automatically filled, while having access to the fields in the `Contentful` node itself.


```javascript
{data.allContentfulAsset.nodes.map(({ title, childImageEngineAsset }) => {
  return <GatsbyImage key={title} image={childImageEngineAsset.gatsbyImageData} alt={title} />;
})}
```

##### responsive_details resolver

```javascript
query {
  allContentfulAsset {
    nodes {
      title
      childImageEngineAsset {
        responsive_details(width: 500, height: 300, compression: 10, format: gif, fit: cropbox, sharpness: 30)
      }
    }
  }
}
```

This will return an object:
```javascript
{
  width: 500,
  height: 300,
  src: "https://....some-source-with-ie.url/file.ext?imgeng=/w_500/h_300/f_gif/cmpr_10/m_cropbox/s_30",
  srcSet: "urls_for_different_sizes_if_specified_in_query",
  sizes: "sizes_breakdown_for_sizes_specified_in_query"
}
```

This can be used directly in an `img` tag, e.g: 
```javascript
<img {...data.allContentfulAsset.nodes[0].childImageEngineAsset.responsive_details}>
```


### React Component

If you just want a component to help in using `ImageEngine` directives without `graphql` you might prefer [@imageengine/react](https://www.npmjs.com/package/@imageengine/react)

### Plain URLs without Graphql

If for some reason you only need to generate only urls with the right query parameters for `ImageEngine` you might import the helper functions in [@imageengine/imageengine-helpers](https://www.npmjs.com/package/@imageengine/imageengine-helpers)

