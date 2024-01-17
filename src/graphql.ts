export const IEFormatGraphql = `enum IEFormat {
  png
  gif
  jpg
  jpeg
  bmp
  webp
  jp2
  svg
  mp4
  jxr
  avif
  jxl
}`;

export const IEFitGraphql = `enum IEFit {
  stretch
  box
  letterbox
  cropbox
  cover
  fill
  inside
  contain
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
  no_optimization: Boolean,
  force_download: "Boolean",
  max_device_pixel_ratio: "Float",
}`

export const IEDirectivesGraphqlObject = {
    width: "Int",
    height: "Int",
    auto_width_fallback: "Int",
    scale_to_screen_width: "Int",
    crop: "[Int]",
    format: "IEFormat",
    fit: "IEFit",
    compression: "Int",
    sharpness: "Int",
    rotate: "Int",
    inline: "Boolean",
    keep_meta: "Boolean",
    no_optimization: "Boolean",
    force_download: "Boolean",
    max_device_pixel_ratio: "Float",
    ie_delivery_address: "String"
};
