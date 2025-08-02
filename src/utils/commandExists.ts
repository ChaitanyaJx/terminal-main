import * as bin from './bin';

export const commandExists = (command: string) => {
  // Include 'clear' and all exported bin commands except the removed ones
  const commands = ['clear', ...Object.keys(bin)];

  return commands.indexOf(command.split(' ')[0]) !== -1;
};