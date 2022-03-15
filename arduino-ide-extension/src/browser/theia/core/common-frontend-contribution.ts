import { inject, injectable } from 'inversify';
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
import { SaveAsSketch } from '../../contributions/save-as-sketch';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import { SketchesService } from '../../../common/protocol';

@injectable()
export class CommonFrontendContribution extends TheiaCommonFrontendContribution {

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

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
    return {
      reason: 'Dirty editors present',
      action: async () => {
        const sketch = await this.sketchServiceClient.currentSketch();
        if (sketch) {
          const isTemp = await this.sketchService.isTemp(sketch);
          if (isTemp) {
            return this.showTempSketchDialog();
          } else if (this.shell.canSaveAll()) {
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
        }
        return true;
      }
    };
  }

  private async showTempSketchDialog(): Promise<boolean> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!sketch) {
      return true;
    }
    const isTemp = await this.sketchService.isTemp(sketch);
    if (!isTemp) {
      return true;
    }
    const messageBoxResult = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        message: nls.localize('arduino/sketch/saveTempSketch', 'Save your sketch to open it again later.'),
        title: 'Arduino-IDE',
        type: 'question',
        buttons: [
          Dialog.CANCEL,
          nls.localizeByDefault('Save As...'),
          nls.localizeByDefault("Don't Save"),
        ],
      }
    )
    const result = messageBoxResult.response;
    if (result === 2) {
      return true;
    } else if (result === 1) {
      return !!(await this.commandRegistry.executeCommand(
        SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
        {
          execOnlyIfTemp: false,
          openAfterMove: false,
          wipeOriginal: true
        }
      ));
    }
    return false
  }
}
