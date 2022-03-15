import { injectable } from 'inversify';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import {
  CommonFrontendContribution as TheiaCommonFrontendContribution,
  CommonCommands,
} from '@theia/core/lib/browser/common-frontend-contribution';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { OnWillStopAction } from '@theia/core/lib/browser/frontend-application';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { nls } from '@theia/core/lib/common/nls';
import { Dialog } from '@theia/core/lib/browser';

@injectable()
export class CommonFrontendContribution extends TheiaCommonFrontendContribution {
  registerCommands(commandRegistry: CommandRegistry): void {
    super.registerCommands(commandRegistry);

    for (const command of [CommonCommands.CONFIGURE_DISPLAY_LANGUAGE]) {
      commandRegistry.unregisterCommand(command);
    }
  }

  registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    for (const command of [
      CommonCommands.SAVE,
      CommonCommands.SAVE_ALL,
      CommonCommands.CUT,
      CommonCommands.COPY,
      CommonCommands.PASTE,
      CommonCommands.COPY_PATH,
      CommonCommands.FIND,
      CommonCommands.REPLACE,
      CommonCommands.AUTO_SAVE,
      CommonCommands.OPEN_PREFERENCES,
      CommonCommands.SELECT_ICON_THEME,
      CommonCommands.SELECT_COLOR_THEME,
      CommonCommands.ABOUT_COMMAND,
      CommonCommands.CLOSE_TAB,
      CommonCommands.CLOSE_OTHER_TABS,
      CommonCommands.CLOSE_ALL_TABS,
      CommonCommands.COLLAPSE_PANEL,
      CommonCommands.SAVE_WITHOUT_FORMATTING, // Patched for https://github.com/eclipse-theia/theia/pull/8877
    ]) {
      registry.unregisterMenuAction(command);
    }
  }

  onWillStop(): OnWillStopAction | undefined {
    try {
      if (this.shouldPreventClose || this.shell.canSaveAll()) {
        return {
          reason: 'Dirty editors present',
          action: async () => {
            const result = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
              title: nls.localize('theia/core/quitTitle', 'Are you sure you want to quit?'),
              message: nls.localize('theia/core/quitMessage', 'Any unsaved changes will not be saved.'),
              buttons: [
                Dialog.NO,
                Dialog.YES
              ]
            });
            return result.response === 1;
          }
        };
      }
    } finally {
      this.shouldPreventClose = false;
    }
  }
}
