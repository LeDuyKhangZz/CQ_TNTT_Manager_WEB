declare module "pdfmake/build/pdfmake" {
  interface CreatedPdf {
    getBuffer(callback: (buffer: Buffer) => void): void;
  }
  const pdfMake: {
    vfs: Record<string, string>;
    createPdf(documentDefinition: unknown): CreatedPdf;
  };
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const fonts: Record<string, string>;
  export default fonts;
}
