import { exec } from 'child_process';
import {
  color,
  defaultPath,
  figlet,
  fs,
  options,
  optionsSelect,
  readline,
  saveConfig,
} from './imports';
import {
  backupConfigFiles,
  deleteBackupFile,
  listBackupFiles,
  useBackupFile,
} from './backup';

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });
};
export const addConfigFile = async () => {
  const name = await askQuestion('Enter a name for the config file: ');

  if (!name) {
    console.log(color.danger('Please enter a name for the config file'));
    optionsSelect();
    return;
  }

  const path = await askQuestion('Enter the path of the config file: ');

  if (!options.path) {
    options.path = defaultPath;
  }
  if (!fs.existsSync(path)) {
    console.log(color.danger('Invalid file path'));
    optionsSelect();
    return;
  }
  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  const newConfig = { id: Date.now(), name, path: path.replace(/"/g, '') };
  config[newConfig.id] = newConfig;
  fs.writeFileSync(options.path, JSON.stringify(config));
  console.log(color.success(`Config file added: ${color.info(name)}`));
  optionsSelect();
};

export const removeConfigFile = async () => {
  if (!fs.existsSync(options.path)) {
    console.log(color.danger('Config file does not exist'));
    optionsSelect();
    return;
  }

  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  const sortedConfig = Object.values(config)
    .filter((c: any) => c.hasOwnProperty('id'))
    .sort((a: any, b: any) => a.id - b.id);

  if (sortedConfig.length === 0) {
    console.log(color.warn('No config files to remove'));
    optionsSelect();
    return;
  }

  sortedConfig.forEach((config: any, index: number) => {
    console.log(color.warn(`[${index + 1}] `) + `${config.name}`);
  });

  const answer = await askQuestion('Enter a number to remove the file: ');
  const index = parseInt(answer) - 1;
  if (index >= 0 && index < sortedConfig.length) {
    const selectedConfig: any = sortedConfig[index];
    delete config[selectedConfig.id];
    fs.writeFileSync(options.path, JSON.stringify(config));
    console.log(
      color.success(`Config file removed: ${color.info(selectedConfig.name)}`)
    );
  } else {
    console.log(color.warn('Invalid number'));
  }
  optionsSelect();
};

export const updateConfigFile = async () => {
  if (!fs.existsSync(options.path)) {
    console.log(color.danger('Config file does not exist'));
    optionsSelect();
    return;
  }

  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  const sortedConfig = Object.values(config)
    .filter((c: any) => c.hasOwnProperty('id'))
    .sort((a: any, b: any) => a.id - b.id);

  if (sortedConfig.length === 0) {
    console.log(color.warn('No config files to update'));
    optionsSelect();
    return;
  }

  sortedConfig.forEach((config: any, index: number) => {
    console.log(color.warn(`[${index + 1}] `) + `${config.name}`);
  });

  const answerIndex = await askQuestion('Enter a number to update the file: ');
  const index = parseInt(answerIndex) - 1;
  if (index >= 0 && index < sortedConfig.length) {
    const selectedConfig: any = sortedConfig[index];
    const info = color.warn('(press enter to leave as it is)');
    const newName = await askQuestion(
      `Enter the new name of the config file ${info}: `
    );
    const newPath = await askQuestion(
      `Enter the new path of the config file ${info}: `
    );
    selectedConfig.name = newName.trim() !== '' ? newName : selectedConfig.name;
    selectedConfig.path = newPath.trim() !== '' ? newPath : selectedConfig.path;
    fs.writeFileSync(options.path, JSON.stringify(config));
    console.log(
      color.success(`Config file updated: ${color.info(selectedConfig.name)}`)
    );
  } else {
    console.log(color.warn('Invalid number'));
  }
  optionsSelect();
};

export const listConfigFiles = async () => {
  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  const sortedConfig = Object.values(config)
    .filter((c: any) => c.hasOwnProperty('id'))
    .sort((a: any, b: any) => a.id - b.id);

  sortedConfig.forEach((config: any, index: number) => {
    const optColor = index % 2 === 0 ? color.notice : color.success;
    console.log(optColor(`[${index + 1}] `) + `${config.name}`);
  });

  if (sortedConfig.length === 0) {
    console.log(color.warn('No config files added'));
    const answer = await askQuestion('Add Config File? (Y/N): ');
    switch (answer.toUpperCase()) {
      case 'Y':
        await addConfigFile();
        break;
      case 'N':
        optionsSelect();
        break;
      default:
        console.log(color.danger('Invalid option'));
        optionsSelect();
        break;
    }
  } else {
    const answerIndex = await askQuestion('Enter a number to open the file: ');
    const index = parseInt(answerIndex) - 1;
    if (index >= 0 && index < sortedConfig.length) {
      const selectedConfig: any = sortedConfig[index];
      const fileData = fs.readFileSync(selectedConfig.path, 'utf-8');
      const editor = config.userConfigs?.editor;
      if (editor) {
        try {
          console.log(
            color.warn(`Opening file ${selectedConfig.name} in ${editor}`)
          );
          exec(`${editor} "${selectedConfig.path}"`, (error: any) => {
            if (error) {
              console.log(
                color.danger(
                  `The editor ${editor} is not installed or not found`
                )
              );
              console.log(color.warn('Please set another editor'));
              setEditor();
            } else {
              optionsSelect();
            }
          });
        } catch (error) {
          console.log(color.danger(`Error opening file: ${error}`));
        }
      } else {
        console.log(color.warn('No editor specified. Set the editor first'));
        setEditor();
      }
    } else {
      console.log(color.warn('Invalid number'));
      optionsSelect();
    }
  }
};
export const checkPath = async () => {
  if (fs.existsSync(defaultPath)) {
    try {
      const configData = fs.readFileSync(defaultPath, 'utf-8');
      const config = JSON.parse(configData);
      options.path = config.userConfigs?.path;
    } catch (err) {
      console.error(`Error reading config: ${err}`);
    }
  } else {
    if (!options.path) {
      options.path = defaultPath;
      saveConfig(defaultPath);
      console.log(color.info(`Config file created on path: ${defaultPath}`));
    } else {
      saveConfig(options.path);
    }
  }

  if (options.path && !fs.existsSync(options.path)) {
    try {
      fs.writeFileSync(options.path, JSON.stringify([]));
    } catch (err) {
      console.error(`Error creating file: ${err}`);
    }
  }
};

export const setEditor = async () => {
  const answer = await askQuestion('Enter the name of the editor: ');
  if (!answer) {
    console.log(color.danger('Please enter a name for the editor'));
    optionsSelect();
    return;
  }
  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  config.userConfigs = config.userConfigs || {};
  config.userConfigs.editor = answer;
  fs.writeFileSync(options.path, JSON.stringify(config));
  console.log(color.success(`Editor set to: ${color.info(answer)}`));
  optionsSelect();
};

export const backupOptions = async () => {
  const backupOpts = `
  Choose an option:
  ${color.warn('[C]')}reate a backup of all config files
  ${color.warn('[L]')}ist all backup files
  ${color.warn('[U]')}se a backup file
  ${color.warn('[D]')}elete a backup file
  ${color.warn('[R]')}eturn to main menu
  ${color.danger('[E]')}xit
  Option: `;
  console.log(
    color.magenta(
      figlet.textSync('Backup Options', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: process.stdout.columns,
        whitespaceBreak: true,
      })
    )
  );
  const answer = await askQuestion(backupOpts);
  switch (answer.toUpperCase()) {
    case 'C':
      backupConfigFiles();
      break;
    case 'L':
      listBackupFiles();
      break;
    case 'U':
      useBackupFile();
      break;
    case 'D':
      deleteBackupFile();
      break;
    case 'R':
      optionsSelect();
      break;
    case 'E':
      console.log(color.danger('Exiting...'));
      rl.close();
      break;
    default:
      console.log(color.danger('Invalid option'));
      backupOptions();
      break;
  }
};
