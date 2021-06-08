import { exec } from 'child_process';

export function ReplaceLine(filename: string, srcStr: string, dstStr: string): any {
  let cmdStr = "sed -i -e   's/" + srcStr + '/' + dstStr + "/g' " + filename;
  console.log(cmdStr);
  exec(cmdStr, function (err, stdout, stderr) {});
}
export function GetUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
