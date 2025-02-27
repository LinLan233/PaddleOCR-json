"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__default = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = require("path");
const child_process_1 = require("child_process");
const currentPath = process.cwd();
exports.__default = {
    path: 'PaddleOCR_json.exe',
    args: ['--use_debug=0'],
    options: {
        argv0: undefined,
        stdio: 'pipe',
        detached: false,
        shell: false,
        windowsVerbatimArguments: undefined,
        windowsHide: true,
    },
    initTag: 'OCR init completed.',
};
function cargs(obj) {
    obj = Object.assign({}, obj);
    if (obj.image_dir === null)
        obj.image_dir = 'clipboard';
    else if (obj.image_dir)
        obj.image_dir = (0, path_1.resolve)(currentPath, obj.image_dir);
    if (obj.output !== undefined)
        obj.output = (0, path_1.resolve)(currentPath, obj.output);
    return obj;
}
function cout(data) {
    return {
        code: data.code,
        message: data.code - 100 ? data.data : '',
        data: data.code - 100 ? null : data.data,
    };
}
if (!worker_threads_1.isMainThread) {
    new Promise((res) => {
        const { path = exports.__default.path, args = [], options, debug = false, } = worker_threads_1.workerData;
        const proc = (0, child_process_1.spawn)(path, args.concat(exports.__default.args), {
            ...options,
            ...exports.__default.options,
        });
        proc.stdout.on('data', function stdout(chunk) {
            if (!chunk.toString().match(exports.__default.initTag))
                return;
            proc.stdout.off('data', stdout);
            return res(proc);
        });
        proc.on('exit', process.exit);
        if (debug) {
            proc.stdout.on('data', (chunk) => console.log(chunk.toString()));
            proc.stderr.on('data', (data) => console.log(data.toString()));
            proc.on('close', (code) => console.log('close code: ', code));
            proc.on('exit', (code) => console.log('exit code: ', code));
        }
    }).then((proc) => {
        worker_threads_1.parentPort.postMessage({
            code: 0,
            message: exports.__default.initTag,
            pid: proc.pid,
            data: null,
        });
        worker_threads_1.parentPort.on('message', (data) => proc.stdin.write(`${JSON.stringify(cargs(data))}\n`));
        proc.stdout.on('data', (chunk) => worker_threads_1.parentPort.postMessage(cout(JSON.parse(chunk))));
    });
}
