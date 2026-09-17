declare module "piexifjs" {
  const piexif: {
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
    dump: (data: Record<string, unknown>) => string;
    insert: (bytes: string, dataUrl: string) => string;
  };
  export default piexif;
}
