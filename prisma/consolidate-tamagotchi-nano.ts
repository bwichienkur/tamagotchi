import "dotenv/config";
import { consolidateTamagotchiNanoDevices } from "../src/lib/consolidate-tamagotchi-nano";

consolidateTamagotchiNanoDevices()
  .then((result) => {
    console.log("Tamagotchi Nano consolidation:", result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
