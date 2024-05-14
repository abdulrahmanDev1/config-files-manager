import fs from 'fs';
import optionsSelect, { configFolderPath, options } from './lib';
import path from 'path';
import { exec } from 'child_process';
import readline from 'readline';
import figlet from 'figlet';
import { Command } from 'commander';
import colors from 'colors-cli/safe';
import {
  rl,
  addConfigFile,
  listConfigFiles,
  setEditor,
  removeConfigFile,
  updateConfigFile,
  backupOptions,
} from './utils';
import runProgram, { defaultPath, saveConfig } from './lib';

const color = {
  error: colors.red.bold,
  warn: colors.yellow,
  notice: colors.blue,
  success: colors.green,
  info: colors.cyan,
  danger: colors.red,
  magenta: colors.magenta,
};

export {
  defaultPath,
  saveConfig,
  optionsSelect,
  configFolderPath,
  options,
  fs,
  path,
  color,
  exec,
  readline,
  figlet,
  Command,
  rl,
  addConfigFile,
  listConfigFiles,
  setEditor,
  removeConfigFile,
  updateConfigFile,
  backupOptions,
  runProgram,
};
