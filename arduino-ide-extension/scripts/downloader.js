const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const download = require('download');
const decompress = require('decompress');
const unzip = require('decompress-unzip');
const untargz = require('decompress-targz');

process.on('unhandledRejection', (reason, _) => {
    shell.echo(String(reason));
    shell.exit(1);
    throw reason;
});
process.on('uncaughtException', error => {
    shell.echo(String(error));
    shell.exit(1);
    throw error;
});

exports.download = async (url, targetFile, filePrefix, force) => {
    const { platform, arch } = process;

    if (fs.existsSync(targetFile) && !force) {
        shell.echo(`Skipping download because file already exists: ${targetFile}`);
        return;
    }
    if (!fs.existsSync(path.dirname(targetFile))) {
        if (shell.mkdir('-p', path.dirname(targetFile)).code !== 0) {
            shell.echo('Could not create new directory.');
            shell.exit(1);
        }
    }

    const downloads = path.join(__dirname, '..', 'downloads');
    if (shell.rm('-rf', targetFile, downloads).code !== 0) {
        shell.exit(1);
    }

    shell.echo(`>>> Downloading from '${url}'...`);
    const data = await download(url);
    shell.echo(`<<< Download succeeded.`);

    shell.echo('>>> Decompressing...');
    const files = await decompress(data, downloads, {
        plugins: [
            unzip(),
            untargz()
        ]
    });
    if (files.length === 0) {
        shell.echo('Error ocurred while decompressing the archive.');
        shell.exit(1);
    }
    const fileIndex = files.findIndex(f => f.path.startsWith(filePrefix));
    if (fileIndex === -1) {
        shell.echo(`The downloaded artifact does not contain any file with prefix ${filePrefix}.`);
        shell.exit(1);
    }
    shell.echo('<<< Decompressing succeeded.');

    if (shell.mv('-f', path.join(downloads, files[fileIndex].path), targetFile).code !== 0) {
        shell.echo(`Could not move file to target path: ${targetFile}`);
        shell.exit(1);
    }
    if (!fs.existsSync(targetFile)) {
        shell.echo(`Could not find file: ${targetFile}`);
        shell.exit(1);
    } else {
        shell.echo(`Done: ${targetFile}`);
    }
}