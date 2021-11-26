export const IEFormatGraphql = `enum IEFormat {
  png
  gif
  jpg
  bmp
  webp
  jp2
  svg
  mp4
  jxr
  avif
}`;

export const IEFitGraphql = `enum IEFit {
  stretch
  box
  letterbox
  cropbox
}`;

export const IEDirectivesGraphql = `type ImageEngineDirectives {
  width: Int
  height: Int
  auto_width_fallback: Int
  scale_to_screen_width: Int
  crop: [Int]
  format: String
  fit: String
  compression: Int
  sharpness: Int
  rotate: Int
  inline: Boolean
  keep_meta: Boolean
  no_optimization: Boolean
}`

export const IEDirectivesGraphqlObject = {
    width: "Int",
    height: "Int",
    auto_width_fallback: "Int",
    scale_to_screen_width: "Int",
    crop: "[Int]",
    format: "String",
    fit: "String",
    compression: "Int",
    sharpness: "Int",
    rotate: "Int",
    inline: "Boolean",
    keep_meta: "Boolean",
    no_optimization: "Boolean",
    ie_distribution: "String"
};
