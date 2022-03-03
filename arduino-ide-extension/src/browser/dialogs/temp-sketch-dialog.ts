import { nls } from "@theia/core";
import { AbstractDialog, Dialog, Message } from "@theia/core/lib/browser";

export class TempSketchDialog extends AbstractDialog<TempSketchDialog.Options> {
  protected readonly dontSaveButton: HTMLButtonElement;
  protected _value: TempSketchDialog.Options = 'Cancel';

  get value(): TempSketchDialog.Options {
    return this._value;
  }

  constructor() {
    super({
        title: nls.localize('theia/core/quitTitle', 'Are you sure you want to quit?')
    });
    const messageNode = document.createElement('div');
    messageNode.textContent = nls.localize('arduino/sketch/saveTempSketch', 'Save your sketch to open it again later.');
    this.contentNode.appendChild(messageNode);
    this.dontSaveButton = this.createButton(nls.localizeByDefault(TempSketchDialog.Values["Don't Save"]));
    this.dontSaveButton.classList.add('secondary');
    this.controlPanel.appendChild(this.dontSaveButton);
    this.appendCloseButton(Dialog.CANCEL);
    this.appendAcceptButton(nls.localizeByDefault(TempSketchDialog.Values['Save As...']));
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.addAction(this.dontSaveButton, () => this.dontSave(), 'click');
  }

  protected addAcceptAction<K extends keyof HTMLElementEventMap>(element: HTMLElement, ...additionalEventTypes: K[]): void {
    this.addAction(element, () => this.doSave(), 'click');
  }

  protected dontSave(): void {
    this._value = TempSketchDialog.Values["Don't Save"];
    this.accept();
  }

  protected doSave(): void {
    this._value = TempSketchDialog.Values['Save As...'];
    this.accept();
  }
}

export namespace TempSketchDialog {
  export const enum Values {
    "Don't Save" = "Don't Save",
    Cancel = 'Cancel',
    'Save As...' = 'Save As...',
  };
  export type Options = keyof typeof Values;
}
