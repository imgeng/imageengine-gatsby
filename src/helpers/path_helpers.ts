import path from "path";

export function static_path_from_source(source: any) {
    return static_path_from_segments(source.internal.contentDigest, source.base_url);
};

export function static_path_from_segments(digest: string, relative_path: string) {
    return path.join(process.cwd(), "public", static_segment(digest, relative_path)
    );
};

export function static_segment(digest: string, relative_path: string) {
    return path.join("static", digest, relative_path);
};
