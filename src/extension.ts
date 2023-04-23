import * as vscode from 'vscode';
import path = require('path');
import { workspace } from 'vscode';
import { Uri } from 'vscode';
import { window } from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('current-dir.showDir', () => {
    getFiles();
  });
  context.subscriptions.push(disposable);
}

const getFiles = () => {
  const input = vscode.window.createQuickPick();
  input.show();
  const document = vscode.window.activeTextEditor?.document;

  if (!document || document.isUntitled) {
    return undefined;
  }
  const workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(
    document.uri
  );

  if (!workspaceFolder || !workspaceFolder.uri.fsPath) {
    return undefined;
  }

  const relativePath = path.normalize(path.dirname(document.uri.path));

  function showFiles(path: string) {
    const contents = fs.readdirSync(path);

    const p = path.split('/').slice(0, -1);
    const first = p.join('/');

    const firstIsOutsideWorkspace = first.length < workspaceFolder!.uri.fsPath.length;
    const files: { label: string; detail: string; uri?: Uri; isDir?: boolean }[] =
      firstIsOutsideWorkspace ? [] : [{ label: '..', detail: first, isDir: true }];

    // create folders
    contents.forEach((name) => {
      const fullPath = `${path}/${name}`;
      const fileState = fs.lstatSync(fullPath);

      if (fileState.isDirectory()) {
        files.push({ label: name, detail: fullPath, isDir: true });
      } else {
        files.push({ label: name, detail: fullPath, uri: Uri.file(fullPath) });
      }
    });

    input.items = files;
  }

  showFiles(relativePath);

  input.onDidAccept(async () => {
    const file = input.selectedItems[0] as any;

    if (file.isDir) {
      showFiles(file.detail);
      return;
    }
    const doc = await workspace.openTextDocument(file.uri);
    await window.showTextDocument(doc);
  });
};

export function deactivate() {}
