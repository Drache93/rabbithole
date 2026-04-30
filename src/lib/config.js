export function initStorageDir(cmd) {
  const dir = cmd.command?.parent?.flags?.storageDir
  if (dir) process.env.WRN_HOME = dir
}
