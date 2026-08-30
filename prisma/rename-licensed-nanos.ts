import "dotenv/config";
import { renameLicensedTamagotchiNanoDevices } from "../src/lib/restructure-tamashell-devices";

renameLicensedTamagotchiNanoDevices()
  .then((renamed) => {
    console.log(`Renamed ${renamed} licensed nano device type(s).`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
