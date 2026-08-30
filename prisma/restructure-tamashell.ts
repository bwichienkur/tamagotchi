import "dotenv/config";
import { restructureTamaShellDevices } from "../src/lib/restructure-tamashell-devices";

restructureTamaShellDevices()
  .then((result) => {
    console.log("TamaShell device restructure:", result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
