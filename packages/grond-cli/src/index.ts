#!/usr/bin/env node
import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { publishCommand } from './commands/publish.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('grond')
  .description('Grond Plugin CLI')
  .version('1.2.1');

program.addCommand(createCommand);
program.addCommand(publishCommand);
program.addCommand(configCommand);

program.parse(process.argv);
