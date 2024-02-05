import { methods} from "./methods.js";
import * as readlinePromises from "readline/promises";


const args = process.argv.slice(2)
export const userName = methods.parseUserName(args)


methods.welcomeUser(userName)
methods.getCurrentDir()

const startApp = function ()  {
    const rl = readlinePromises.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on('line', async (line) => {

       const [command, ...args] = methods.parseString(line)

       if ( !!await methods.runCommand(command, args)) {
           methods.getCurrentDir();
       } else {
           rl.close()
       }
    })
}

startApp()
