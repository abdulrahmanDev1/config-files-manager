import { color } from './imports';
import optionsSelect, { options, program } from './lib';
import {
  addConfigFile,
  backupOptions,
  checkPath,
  listConfigFiles,
  removeConfigFile,
  setEditor,
  updateConfigFile,
} from './utils';
export * from './utils';
export * from './lib';

program
  .name('Config Files Manager')
  .version((require('../package.json') as { version: string }).version)
  .description('A CLI tool to manage your configuration files');

program
  // .option('-p, --path ', 'Path to the configuration file')
  .option('-a, --add', 'Add a new configuration file')
  .option('-l, --list', 'List all configuration files')
  .option('-r, --remove', 'Remove a configuration file')
  .option('-u, --update', 'Update a configuration file')
  .option('-b, --backup', 'Backup options')
  .option('-s, --set-editor', 'Set the editor')
  .parse(process.argv);

if (!process.argv[2]) {
  optionsSelect();
}

(async () => {
  checkPath();
  if (options.add) {
    await addConfigFile(true);
  }
  if (options.list) {
    await listConfigFiles(true);
  }
  if (options.remove) {
    await removeConfigFile(true);
  }
  if (options.update) {
    await updateConfigFile(true);
  }
  if (options.backup) {
    await backupOptions();
  }
  if (options.set) {
    await setEditor(true);
  }
  if (
    !options.add &&
    !options.list &&
    !options.remove &&
    !options.update &&
    !options.backup &&
    !options.set &&
    process.argv[2]
  ) {
    console.log('Invalid option. Please provide a valid option.');
  }
})().catch((error) => console.error(error));
