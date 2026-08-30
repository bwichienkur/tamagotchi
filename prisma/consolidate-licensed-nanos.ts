import "dotenv/config";
import { consolidateLicensedNanosDevices } from "../src/lib/consolidate-licensed-nanos";

consolidateLicensedNanosDevices()
  .then((result) => {
    console.log("Licensed Nanos consolidation:", result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
