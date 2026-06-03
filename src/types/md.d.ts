/**
 * Module declaration for importing `.md` files as plain text strings.
 *
 * The esbuild build configuration uses the `text` loader for `.md` files,
 * which causes them to be bundled as string exports. This declaration
 * allows TypeScript to type-check imports of these files without error.
 */
declare module "*.md" {
  const content: string;
  export default content;
}
