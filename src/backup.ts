import path from 'path';
import {
  backupOptions,
  color,
  configFolderPath,
  fs,
  options,
  optionsSelect,
  rl,
  setEditor,
} from './imports';
import { exec } from 'child_process';

export const backupConfigFiles = () => {
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
    console.log(color.warn('No config files to backup'));
    optionsSelect();
    return;
  }

  const backupFolderPath = `${configFolderPath}/backup`;
  if (!fs.existsSync(backupFolderPath)) {
    fs.mkdirSync(backupFolderPath);
  }

  const backupData: {
    id: number;
    name: string;
    path: string;
    backupName: string;
  }[] = [];

  sortedConfig.forEach((config: any) => {
    const { id, path: configPath } = config;
    const name = path.basename(configPath);
    const backupName =
      name.replace(/\.[^/.]+$/, '') + '_backup' + path.extname(name);
    const backupPath = `${backupFolderPath}/${backupName}`;

    fs.copyFileSync(configPath, backupPath);
    console.log(
      color.success(`Config file backed up: ${color.info(backupName)}`)
    );

    backupData.push({ id, name, path: configPath, backupName });
  });

  const backupDataFilePath = `${configFolderPath}/backupData.json`;
  if (!fs.existsSync(backupDataFilePath)) {
    fs.writeFileSync(backupDataFilePath, JSON.stringify(backupData));
  } else {
    const existingData = fs.readFileSync(backupDataFilePath, 'utf-8');
    const parsedData = JSON.parse(existingData);
    const newData = [...parsedData, ...backupData];
    fs.writeFileSync(backupDataFilePath, JSON.stringify(newData));
  }
  console.log(color.success('Backup data saved to backupData.json'));

  backupOptions();
};

export const listBackupFiles = () => {
  const backupFolderPath = `${configFolderPath}/backup`;
  if (!fs.existsSync(backupFolderPath)) {
    console.log(color.warn('No backup files found'));
    backupOptions();
    return;
  }

  const backupFiles = fs.readdirSync(backupFolderPath);
  backupFiles.forEach((file, index) => {
    console.log(color.warn(`[${index + 1}] `) + `${file}`);
  });
  if (backupFiles.length === 0) {
    console.log(color.warn('No backup files found'));
    rl.question(
      'Do you want to backup the config files? (y/n): ',
      (answer: string) => {
        if (answer === 'y') {
          backupConfigFiles();
        } else {
          backupOptions();
        }
      }
    );
  }

  backupFiles.forEach((file, index) => {
    console.log(color.warn(`[${index + 1}] `) + `${file}`);
  });
  rl.question('Enter a number to open the file: ', (answer: string) => {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < backupFiles.length) {
      const selectedFile = backupFiles[index];
      const configData = fs.readFileSync(options.path, 'utf-8');
      const config = JSON.parse(configData);
      const editor = config.userConfigs?.editor;
      if (editor) {
        try {
          console.log(color.warn(`Opening file ${selectedFile} in ${editor}`));
          exec(
            `${editor} "${backupFolderPath}/${selectedFile}"`,
            (error: any) => {
              if (error) {
                console.log(
                  color.danger(
                    `The editor ${editor} is not installed or not found`
                  )
                );
                console.log(color.warn('Please set another editor'));
                setEditor();
              } else {
                backupOptions();
              }
            }
          );
        } catch (error) {
          console.log(color.danger(`Error opening file: ${error}`));
        }
      } else {
        console.log(color.warn('No editor specified. Set the editor first'));
        setEditor();
      }
    } else {
      console.log(color.warn('Invalid number'));
      backupOptions();
    }
  });
};

export const useBackupFile = () => {
  const backupFolderPath = `${configFolderPath}/backup`;
  if (!fs.existsSync(backupFolderPath)) {
    console.log(color.warn('No backup files found'));
    backupOptions();
    return;
  }

  const backupFiles = fs.readdirSync(backupFolderPath);
  backupFiles.forEach((file, index) => {
    console.log(color.warn(`[${index + 1}] `) + `${file}`);
  });

  rl.question('Enter a number to use the file: ', (answer: string) => {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < backupFiles.length) {
      const selectedFile = backupFiles[index];
      const backupPath = `${backupFolderPath}/${selectedFile}`;

      const backupDataFilePath = `${configFolderPath}/backupData.json`;
      const backupData = JSON.parse(
        fs.readFileSync(backupDataFilePath, 'utf-8')
      );
      const originalFileData = backupData.find(
        (data: any) => data.backupName === selectedFile
      );

      if (originalFileData) {
        const originalFilePath = originalFileData.path;
        fs.copyFileSync(backupPath, originalFilePath);
        console.log(
          color.success(
            `File replaced with backup: ${color.info(originalFilePath)}`
          )
        );
      } else {
        console.log(
          color.danger('Original file path not found in backup data')
        );
      }
    } else {
      console.log(color.warn('Invalid number'));
    }

    backupOptions();
  });
};

export const deleteBackupFile = () => {
  const backupFolderPath = `${configFolderPath}/backup`;
  if (!fs.existsSync(backupFolderPath)) {
    console.log(color.warn('No backup files found'));
    backupOptions();
    return;
  }

  const backupFiles = fs.readdirSync(backupFolderPath);
  backupFiles.forEach((file, index) => {
    console.log(color.warn(`[${index + 1}] `) + `${file}`);
  });

  rl.question('Enter a number to delete the file: ', (answer: string) => {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < backupFiles.length) {
      const selectedFile = backupFiles[index];
      if (selectedFile) {
        fs.unlinkSync(`${backupFolderPath}/${selectedFile}`);
        console.log(
          color.danger(`Backup file deleted: ${color.info(selectedFile)}`)
        );

        const backupDataFilePath = `${configFolderPath}/backupData.json`;
        const backupData = JSON.parse(
          fs.readFileSync(backupDataFilePath, 'utf-8')
        );
        const updatedData = backupData.filter(
          (data: any) => data.backupName !== selectedFile
        );
        fs.writeFileSync(backupDataFilePath, JSON.stringify(updatedData));
        console.log(color.success('Backup data updated'));
      } else {
        console.log(color.danger('Selected file is undefined'));
      }
    } else {
      console.log(color.warn('Invalid number'));
    }

    backupOptions();
  });
};
