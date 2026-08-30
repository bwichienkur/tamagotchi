import "dotenv/config";
import { backfillDeviceGenerations } from "../src/lib/backfill-device-generations";

backfillDeviceGenerations()
  .then((result) => {
    console.log("Device generation backfill complete:", result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
