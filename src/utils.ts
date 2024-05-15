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

export const addConfigFile = async (fromCli?: boolean): Promise<void> => {
  const name = await askQuestion('Enter a name for the config file: ');

  if (!name) {
    console.log(color.danger('Please enter a name for the config file'));
    console.log(color.gray('or Ctrl + C to exit'));
    return addConfigFile(fromCli);
  }

  const path = await askQuestion('Enter the path of the config file: ');

  if (!path) {
    console.log(color.danger('Please enter a path for the config file '));
    console.log(color.gray('or Ctrl + C to exit'));
    return addConfigFile(fromCli);
  }

  const cleanPath = path.replace(/^"|"$/g, '');
  const configData = fs.readFileSync(options.path || defaultPath, 'utf-8');
  const config = JSON.parse(configData);

  const existingFile = Object.values(config).find(
    (c: any) => c.path === cleanPath || c.name === name
  ) as any;

  if (existingFile) {
    if (existingFile.path === cleanPath) {
      console.log(color.danger('File already exists'));
      console.log(color.warn(`Name: ${existingFile.name}`));
      console.log(color.warn(`Path: ${color.danger(existingFile.path)}`));
      process.exit(1);
    } else if (existingFile.name === name) {
      console.log(color.danger('A file already exists with the same name'));
      console.log(color.warn(`Name: ${color.danger(existingFile.name)}`));
      console.log(color.warn(`Path: ${existingFile.path}`));
      process.exit(1);
    }
  }

  if (!fs.existsSync(cleanPath)) {
    console.log(color.danger('Invalid file path'));
    return optionsSelect();
  }

  const newConfig = { id: Date.now(), name, path: cleanPath };
  config[newConfig.id] = newConfig;
  try {
    fs.writeFileSync(options.path || defaultPath, JSON.stringify(config));
    console.log(color.success(`Config file added: ${color.info(name)}`));
    if (fromCli) {
      rl.close();
    } else {
      optionsSelect();
    }
  } catch (error) {
    console.error(`Error writing file: ${error}`);
  }
};

export const removeConfigFile = async (fromCli?: boolean) => {
  if (!fs.existsSync(options.path)) {
    console.log(color.danger('Config file does not exist'));
    options.path = defaultPath;
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
    if (fromCli) {
      rl.close();
    }
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
    console.log(color.danger('Invalid number'));
  }
  if (fromCli) {
    process.exit(0);
  }
  optionsSelect();
};

export const updateConfigFile = async (fromCli?: boolean) => {
  if (!fs.existsSync(options.path)) {
    console.log(color.danger('Config file does not exist'));
    options.path = defaultPath;
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
    if (fromCli) {
      process.exit(0);
    }
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
    console.log(color.danger('Invalid number'));
  }
  if (fromCli) {
    process.exit(0);
  }
  optionsSelect();
};

export const listConfigFiles = async (fromCli?: boolean) => {
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
        if (fromCli) {
          rl.close();
        }
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
            color.success(
              `Opening file ${color.info(selectedConfig.name)} in ${editor}`
            )
          );
          exec(`${editor} "${selectedConfig.path}"`, (error: any) => {
            if (error) {
              //TODO: Add support for terminal editors
              console.log(
                color.danger(
                  `The editor ${editor} is not installed or not found`
                )
              );
              console.log(color.warn('Please set another editor'));
              if (fromCli) {
                setEditor(true);
              }
              setEditor();
            } else {
              if (fromCli) {
                process.exit(0);
              }
              optionsSelect();
            }
          });
        } catch (error) {
          console.log(color.danger(`Error opening file: ${error}`));
        }
      } else {
        console.log(color.warn('No editor specified. Set the editor first'));
        if (fromCli) {
          setEditor(true);
        }
        setEditor();
      }
    } else {
      console.log(color.danger('Invalid number'));
      if (fromCli) {
        process.exit(1);
      }
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

export const setEditor = async (fromCli?: boolean) => {
  const answer = await askQuestion('Enter the name of the editor: ');
  if (!answer) {
    console.log(color.danger('Please enter a name for the editor'));
    console.log(color.gray('or Ctrl + C to exit'));
    setEditor(fromCli);
    return;
  }
  const configData = fs.readFileSync(options.path, 'utf-8');
  const config = JSON.parse(configData);
  config.userConfigs = config.userConfigs || {};
  config.userConfigs.editor = answer;
  fs.writeFileSync(options.path, JSON.stringify(config));
  console.log(color.success(`Editor set to: ${color.info(answer)}`));
  if (fromCli) {
    process.exit(0);
  }
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
