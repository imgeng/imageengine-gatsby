import { IEDefaultPlatforms } from "./types";

type PlatformObject = {
    platform: string,
    node_types: string[]
};

const platforms: PlatformObject[] = [
    {platform: "contentful", node_types: ["ContentfulAsset"]},
    {platform: "sanityio", node_types: ["SanityImageAsset"]},
    {platform: "file", node_types: ["File", "StaticImage"]},
    {platform: "storyblok", node_types: ["StoryblokEntry"]}
];

export const child_ofs: string[] = platforms.reduce((acc, {node_types}) => {
    node_types.forEach((node_type) => acc.push(node_type));
    return acc;
}, [] as string[]);

export const default_platforms: IEDefaultPlatforms = platforms.reduce((acc, {platform}) => {
    acc[platform] = require(`./platforms/${platform}`).default;
    return acc;
}, {} as IEDefaultPlatforms);
