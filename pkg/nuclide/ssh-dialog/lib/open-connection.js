'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {
  getDefaultConnectionProfile,
  getOfficialRemoteServerCommand,
  onSavedConnectionProfilesDidChange,
  saveConnectionConfig,
} from './connection-profile-utils';

import type {Disposable} from 'atom';
import type {RemoteConnection} from 'nuclide-remote-connection';
import type {NuclideRemoteConnectionProfile} from './connection-types';

let dialogPromiseQueue: ?PromiseQueue = null;

/**
 * Opens the remote connection dialog flow, which includes asking the user
 * for connection parameters (e.g. username, server name, etc), and optionally
 * asking for additional (e.g. 2-fac) authentication.
 */
export function openConnectionDialog(props): Promise<?RemoteConnection> {
  const {extend, PromiseQueue} = require('nuclide-commons');
  if (!dialogPromiseQueue) {
    dialogPromiseQueue = new PromiseQueue();
  }

  return dialogPromiseQueue.submit((resolve, reject) => {
    const React = require('react-for-atom');
    const ConnectionDialog = require('./ConnectionDialog');
    const workspaceEl = atom.views.getView(atom.workspace);
    const hostEl = document.createElement('div');
    workspaceEl.appendChild(hostEl);

    // During the lifetime of this 'openConnectionDialog' flow, the 'default'
    // connection profile should not change (even if it is reset by the user
    // connecting to a remote project from another Atom window).
    const defaultConnectionProfile: NuclideRemoteConnectionProfile = getDefaultConnectionProfile();

    // We want to observe changes in the saved connection profiles during the
    // lifetime of this connection dialog, because the user can add/delete
    // a profile from a connection dialog.
    let connectionProfilesSubscription: ?Disposable = null;
    function cleanupSubscriptionFunc(): void {
      if (connectionProfilesSubscription) {
        connectionProfilesSubscription.dispose();
      }
    }

    // The connection profiles could change, but the rest of the props passed
    // to the ConnectionDialog will not.
    // Note: the `cleanupSubscriptionFunc` is called when the dialog closes:
    // `onConnect`, `onError`, or `onCancel`.
    const baseDialogProps = extend.immutableExtend({
      // Select the default connection profile, which should always be index 0.
      indexOfInitiallySelectedConnectionProfile: 0,
      // TODO jessicalin This will be filled in and used later in this stack.
      onAddProfileClicked: () => {},
      // TODO jessicalin This will be filled in and used later in this stack.
      onDeleteProfileClicked: () => {},
      onConnect: async (connection, config) => {
        resolve(connection);
        saveConnectionConfig(config, getOfficialRemoteServerCommand());
        cleanupSubscriptionFunc();
      },
      onError: (err, config) => {
        resolve(/*connection*/ null);
        saveConnectionConfig(config, getOfficialRemoteServerCommand());
        cleanupSubscriptionFunc();
      },
      onCancel: () => {
        resolve(/*connection*/ null);
        cleanupSubscriptionFunc();
      },
      onClosed: () => {
        // Unmount the ConnectionDialog and clean up the host element.
        if (hostEl) {
          React.unmountComponentAtNode(hostEl);
          if (hostEl.parentNode) {
            hostEl.parentNode.removeChild(hostEl);
          }
        }
      },
    }, props);

    // If/when the saved connection profiles change, we want to re-render the dialog
    // with the new set of connection profiles.
    connectionProfilesSubscription = onSavedConnectionProfilesDidChange(
      (newProfiles: ?Array<NuclideRemoteConnectionProfile>) => {
        const connectionProfiles = newProfiles ? [defaultConnectionProfile].concat(newProfiles) :
            [defaultConnectionProfile];
        const newDialogProps = extend.immutableExtend(baseDialogProps, {connectionProfiles});
        React.render(<ConnectionDialog {...newDialogProps} />, hostEl);
      }
    );

    const initialDialogProps = extend.immutableExtend(baseDialogProps, {
      connectionProfiles: [defaultConnectionProfile],
    });
    React.render(<ConnectionDialog {...initialDialogProps} />, hostEl);
  });
}
