const stream = require('stream');
const childProcess = require('child_process');

const isWindows = process.platform === 'win32';

const createReadStream = (filePath, {tail = null} = {}) => {
  const cmd = (() => {
    if (!isWindows) {
      return ['tail', '-f'].concat(tail !== null ? ['-n', String(tail)] : []).concat(filePath);
    } else {
      return ['powershell.exe', '-Command', `Get-Content -Wait ${tail !== null ? ('-Tail ' + tail) : ''} "${filePath.replace(/"/g, '\\"')}"`];
    }
  })();

  const s = new stream.PassThrough();
  s.destroy = () => {
    cp.kill();

    cp.stdout.unpipe(s);
  };

  const cp = childProcess.spawn(cmd[0], cmd.slice(1));
  cp.on('exit', code => {
    if (code !== null && code !== 0) {
      s.emit('error', new Error('tail process exited with nonzero status code: ' + code));
    }
  });
  cp.on('error', err => {
    s.emit('error', err);
  });
  cp.stdout.pipe(s);

  return s;
};

module.exports = {
  createReadStream,
};
