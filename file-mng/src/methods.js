import path from "node:path";
import fs from 'fs/promises';
import { createReadStream, createWriteStream, constants } from 'fs'
import { pipeline } from 'stream/promises'
import zlib from "zlib";
import { createHash } from 'crypto';
import os from "node:os";
import {userName} from "./app.js";

const Dirname = {
    root: os.homedir(),
    currentPath: '',
    setPath: function (p) {this.currentPath = p},
    getDirNAme: function () {
        return this.currentPath || this.root
    }
}
const throwError = (flag) => {console.log(flag === 1 ? 'Invalid input' : 'Operation failed')}

const welcomeUser = (name) => {
    console.log(`Welcome to the File Manager, ${name}!`)
}

// general
const parseUserName = (args) => (args[args.length - 1] && args[args.length - 1].includes("--username="))
        ? args[args.length - 1].replace("--username=", "").trim() : "New User"

const getCurrentDir = function (){
    const currentPath = Dirname.getDirNAme()
    console.log(`You are currently in ${currentPath}`)
}

const parseString = (str) => str.split(" ")

// FS
const checkForAccessFile = (name) =>  fs.access(name, constants.F_OK)

const catFile = async (filePath) => {
    const data = await fs.readFile(filePath, { encoding: 'utf8' });
    console.log(data)
}

const addFile = async (fileName, data='') => {
    await fs.writeFile(`${fileName}`, data, {flag: 'wx'})
};

const renameFile = async (path_to_file, new_filename) => {
    await fs.rename(path_to_file, new_filename)
};

const removeFile = async (path_to_file) => {
    await fs.unlink(path_to_file)
}

const copyFile = async (file, newFile) => {
    await checkForAccessFile(file).catch(() => {throwError(0)})
    const readFile = createReadStream(file)
    const writeFile = createWriteStream(newFile)
    await pipeline(readFile, writeFile)
}

const moveFile = async (path_to_file, path_to_new_directory) => {
    await checkForAccessFile(path_to_file).catch(() => {throwError(0)})
    const readFile = createReadStream(path_to_file)
    const writeFile = createWriteStream(path_to_new_directory)
    await pipeline(readFile, writeFile)
    await fs.unlink(path_to_file)
}

const compress = async (path_to_file, path_to_destination) => {
    await checkForAccessFile(path_to_file).catch(() => {throwError(0)})
    const readStream = createReadStream(path_to_file)
    const writeStream = createWriteStream(path_to_destination)
    const compressStream = zlib.createGzip()
    await readStream
        .pipe(compressStream)
        .pipe(writeStream)
};

const decompress = async (path_to_file, path_to_destination) => {
    const writeStream = createWriteStream(path_to_destination)
    const readStream =  createReadStream(path_to_file)
    const decompressStream = zlib.createGunzip()
    await readStream
        .pipe(decompressStream)
        .pipe(writeStream)
};

const calculateHash = async (path_to_file) => {
    const data = await fs.readFile(path_to_file, { encoding: 'utf8' });
    const hash = createHash('sha256').update(data).digest('hex');

    process.stdout.write(hash);

};

const getListOfFiles = async (path) => {
    const listIfFiles = (await fs.readdir(path, {withFileTypes: true}))
        .sort((a,b) => a.isFile() - b.isFile())
        .filter((file) => !file.isSymbolicLink())
        .map((file) => ({
            file: file.name,
            type: file.isDirectory() ? 'directory' : 'file'
        }))
    console.table(listIfFiles)
}


// exit
const exitApp = () => {
    console.log(`Thank you for using File Manager, ${userName}, goodbye!`)
}

// OS
const runCommandOS = (arg) => {
    switch(arg.toLowerCase()) {
        case '--eol':
            console.log(os.EOL)
            break;
        case '--cpus':
            console.log(os.cpus().length)
            os.cpus().map((cpus) => {console.log(`Model: ${cpus.model}. Clock rate: ${cpus.speed/1000}GHZ`)})
            break;
        case '--homedir':
            console.log(os.homedir())
            break;
        case '--username':
            console.log(os.userInfo().username)
            break;
        case '--architecture':
            console.log(process.arch)
            break;
        default:
            throwError(1);
            break;
    }
}

// path
const upPath = async () => {
    try {
        const newPath = path.join(Dirname.getDirNAme(), '..')
        console.log("UP", newPath)
        await checkForAccessFile(newPath)
        await (newPath.includes(Dirname.root) ? Dirname.setPath(newPath) : Dirname.setPath(Dirname.currentPath))
    } catch (err) {
        console.log(err)
    }
}

const cdPath = async function (cdNewPath) {
    try {
        const newPath = path.join(Dirname.getDirNAme(), cdNewPath)
        await checkForAccessFile(newPath)
        await Dirname.setPath(newPath)
    }catch (err) {
        console.log(err)
    }
}

// main
const runCommand = async  function (command, args)  {
    switch(command) {
        case 'cat':
            await catFile(args[0]).catch(() => { methods.throwError(1) } );
            return true;
        case 'add':
            await addFile(args[0], args[1]).catch(() => {methods.throwError(1)});
            return true;
        case 'rn':
            await  renameFile(args[0], args[1]).catch(() => {methods.throwError(1)});
            return true;
        case 'cp':
            await copyFile(args[0], args[1]).catch(() => {methods.throwError(1)});
            return true;
        case 'rm':
            await removeFile(args[0]).catch(() => {methods.throwError(1)});
            return true;
        case 'mv':
            await moveFile(args[0], args[1]).catch(() => {methods.throwError(1)})
            return true;
        case 'compress':
            await compress(args[0], args[1]).catch(() => {methods.throwError(1)});
            return true;
        case 'decompress':
            await decompress(args[0], args[1]).catch(() => {methods.throwError(1)});
            return true;
        case 'hash':
            await calculateHash(args[0]).catch(() => {methods.throwError(1)});
            return true;
        case 'os':
            await runCommandOS(args[0]);
            return true;
        case 'ls':
            await getListOfFiles(args[0]).catch(() => {methods.throwError(1)});
            return true;
        case 'up':
            await upPath().catch(() => {methods.throwError(1)});
            return true;
        case 'cd':
            await cdPath(args[0]).catch(() => {methods.throwError(1)});
            return true;
        case '.exit':
            await exitApp();
            return false;
        default:
            await throwError(0);
            return true;
    }
}

export const  methods= {
    welcomeUser,
    parseUserName,
    getCurrentDir,
    parseString,
    runCommand,
    throwError,
    exitApp
}
