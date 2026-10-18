/**
 * Uploadthing client helpers. The FileRouter type is imported only as a type
 * (erased at compile time), so the client bundle never pulls in the
 * Node-only server adapter.
 */
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../../api/uploadthing";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
