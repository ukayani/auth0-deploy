const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');

const getFileContent = (file) => {
  return fs.readFile(file, 'utf-8');
};

const getDirectories = (dir) => {
  return co(function* () {
    const files = yield fs.readdir(dir);

    const directories = [];
    for (let i in files) {
      const f = files[i];
      const file = yield fs.stat(path.join(dir, f));
      if (file.isDirectory()) {
        directories.push(path.join(dir, f));
      }
    }

    return directories;
  })();
};

module.exports = {
  getFileContent,
  getDirectories
};
