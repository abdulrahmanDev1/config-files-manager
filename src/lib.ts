import {
  Command,
  addConfigFile,
  backupOptions,
  color,
  figlet,
  fs,
  listConfigFiles,
  removeConfigFile,
  rl,
  setEditor,
  updateConfigFile,
} from './imports';
import { checkPath } from './utils';

export const program = new Command();

export const configFolderPath = `${require('os').homedir()}/.config-files-manager`;
if (!fs.existsSync(configFolderPath)) {
  fs.mkdirSync(configFolderPath);
}
export const defaultPath = `${configFolderPath}/config.json`;

export const options = program.opts();

if (!options.path) {
  options.path = defaultPath;
}

export async function saveConfig(path: string) {
  try {
    const userConfigs = {
      userConfigs: {
        path: path,
      },
    };
    await fs.promises.writeFile(path, JSON.stringify(userConfigs));
    options.path = path;
  } catch (err) {
    console.error(`Error saving config: ${err}`);
  }
}

const opts = `
Choose an option:
${color.info('[A]')}dd a new Config file
${color.info('[L]')}ist all config files
${color.info('[R]')}emove a config file
${color.info('[U]')}pdate a config file
${color.info('[B]')}ackup options
${color.info('[S]')}et the editor
${color.info('[P]')}ath of the config file
${color.danger('[E]')}xit
Option: `;

const ASCII = () => {
  console.log(
    color.notice(
      figlet.textSync('Config Files Manager', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: process.stdout.columns,
        whitespaceBreak: true,
      })
    )
  );
};

const showPath = () => {
  console.log(color.info(`Path: ${color.warn(`${options.path}`)}`));
  optionsSelect();
};

const optsSelect = async (option: string) => {
  switch (option) {
    case 'A':
      await addConfigFile();
      break;
    case 'L':
      await listConfigFiles();
      break;
    case 'R':
      await removeConfigFile();
      break;
    case 'U':
      await updateConfigFile();
      break;
    case 'B':
      await backupOptions();
      break;
    case 'S':
      await setEditor();
      break;
    case 'P':
      showPath();
      break;
    case 'E':
      console.log(color.danger('Exiting...'));
      rl.close();
      break;
    default:
      console.log(color.danger('Invalid option'));
      optionsSelect();
      break;
  }
};

/**
 * Displays the main menu and prompts the user to select an option.
 */
export default async function optionsSelect() {
  checkPath();
  ASCII();
  rl.question(opts, async (answer: string) => {
    await optsSelect(answer.toUpperCase());
  });
}
