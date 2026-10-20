// Type-checked with moduleResolution node10 (ignores "exports"), like Metro
// without package-exports: `moosyl-sdk/client` must resolve via client/package.json.
import { Moosyl, type PayResult } from "moosyl-sdk/client";

export const pay: Promise<PayResult> = new Moosyl("k").pay({
  configurationId: "c",
  transactionId: "t",
  phoneNumber: "p",
});
