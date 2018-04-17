'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AndroidLaunchComponent = undefined;

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _react = _interopRequireWildcard(require('react'));

var _AtomInput;

function _load_AtomInput() {
  return _AtomInput = require('nuclide-commons-ui/AtomInput');
}

var _Dropdown;

function _load_Dropdown() {
  return _Dropdown = require('nuclide-commons-ui/Dropdown');
}

var _AdbDeviceSelector;

function _load_AdbDeviceSelector() {
  return _AdbDeviceSelector = require('./AdbDeviceSelector');
}

var _JavaDebuggerServiceHelpers;

function _load_JavaDebuggerServiceHelpers() {
  return _JavaDebuggerServiceHelpers = require('./JavaDebuggerServiceHelpers');
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('nuclide-commons/UniversalDisposable'));
}

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('nuclide-commons/nuclideUri'));
}

var _nuclideRemoteConnection;

function _load_nuclideRemoteConnection() {
  return _nuclideRemoteConnection = require('../../nuclide-remote-connection');
}

var _debounce;

function _load_debounce() {
  return _debounce = _interopRequireDefault(require('nuclide-commons/debounce'));
}

var _nuclideDebuggerCommon;

function _load_nuclideDebuggerCommon() {
  return _nuclideDebuggerCommon = require('nuclide-debugger-common');
}

var _EmulatorUtils;

function _load_EmulatorUtils() {
  return _EmulatorUtils = require('./EmulatorUtils');
}

var _expected;

function _load_expected() {
  return _expected = require('nuclide-commons/expected');
}

var _LoadingSpinner;

function _load_LoadingSpinner() {
  return _LoadingSpinner = require('nuclide-commons-ui/LoadingSpinner');
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AndroidLaunchComponent extends _react.Component {

  constructor(props) {
    var _this;

    _this = super(props);

    this._debugButtonShouldEnable = () => {
      return this.state.selectedDevice != null && this.state.launchPackage.trim() !== '' && (this.state.launchActivity.trim() !== '' || this.state.launchService.trim() !== '') && this.state.launchAction.trim() !== '';
    };

    this._handleLaunchClick = (0, _asyncToGenerator.default)(function* () {
      const packageName = _this.state.launchPackage.trim().replace(/'/g, '');
      const activity = _this.state.launchActivity.trim().replace(/'/g, '');
      const service = _this.state.launchService.trim().replace(/'/g, '');
      const action = _this.state.launchAction.trim().replace(/'/g, '');
      const adbService = (0, (_JavaDebuggerServiceHelpers || _load_JavaDebuggerServiceHelpers()).getAdbService)(_this.props.targetUri);
      const device = _this.state.selectedDevice;

      if (!(device != null)) {
        throw new Error('No device selected.');
      }

      yield (0, (_JavaDebuggerServiceHelpers || _load_JavaDebuggerServiceHelpers()).debugAndroidDebuggerService)(null /* pid */
      , adbService, service, activity, action, device, packageName, _this.props.targetUri /* adbServiceUri */
      , _this.props.targetUri);

      (0, (_nuclideDebuggerCommon || _load_nuclideDebuggerCommon()).serializeDebuggerConfig)(..._this._getSerializationArgs(), {
        selectedDeviceName: device.name,
        launchPackage: _this.state.launchPackage,
        launchActivity: _this.state.launchActivity,
        launchService: _this.state.launchService,
        launchAction: _this.state.launchAction
      });
    });
    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default();
    this._deserializedSavedSettings = false;
    this._adbService = (0, (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).getAdbServiceByNuclideUri)(this.props.targetUri);
    this._setAdbPorts = (0, (_debounce || _load_debounce()).default)(this._setAdbPorts.bind(this), 1000);
    this._handleDeviceChange = this._handleDeviceChange.bind(this);

    this.state = {
      selectedDevice: null,
      launchPackage: '',
      launchActivity: '',
      launchService: '',
      launchAction: '',
      packages: (_expected || _load_expected()).Expect.value([]),
      adbPorts: '',
      adbPath: null
    };
  }

  _getAdbParameters() {
    var _this2 = this;

    return (0, _asyncToGenerator.default)(function* () {
      _this2.setState({
        adbPorts: (yield (0, (_EmulatorUtils || _load_EmulatorUtils()).getAdbPorts)(_this2.props.targetUri)).join(', '),
        adbPath: yield (0, (_EmulatorUtils || _load_EmulatorUtils()).getAdbPath)()
      });
    })();
  }

  _getSerializationArgs() {
    return [(_nuclideUri || _load_nuclideUri()).default.isRemote(this.props.targetUri) ? (_nuclideUri || _load_nuclideUri()).default.getHostname(this.props.targetUri) : 'local', 'launch', 'Java - Android'];
  }

  componentDidMount() {
    var _this3 = this;

    this._disposables.add(atom.commands.add('atom-workspace', {
      'core:confirm': (() => {
        var _ref2 = (0, _asyncToGenerator.default)(function* () {
          if (_this3._debugButtonShouldEnable()) {
            yield _this3._handleLaunchClick();
          }
        });

        return function coreConfirm() {
          return _ref2.apply(this, arguments);
        };
      })()
    }));

    this._getAdbParameters();
    (0, (_nuclideDebuggerCommon || _load_nuclideDebuggerCommon()).deserializeDebuggerConfig)(...this._getSerializationArgs(), (transientSettings, savedSettings) => {
      this.setState({
        launchPackage: savedSettings.launchPackage || '',
        launchActivity: savedSettings.launchActivity || '',
        launchService: savedSettings.launchService || '',
        launchAction: savedSettings.launchAction || ''
      });
    });
  }

  componentWillUnmount() {
    this._disposables.dispose();
  }

  setState(newState) {
    super.setState(newState, () => this.props.configIsValidChanged(this._debugButtonShouldEnable()));
  }

  _handleDeviceChange(device) {
    if (!this._deserializedSavedSettings) {
      this._deserializedSavedSettings = true;
      (0, (_nuclideDebuggerCommon || _load_nuclideDebuggerCommon()).deserializeDebuggerConfig)(...this._getSerializationArgs(), (transientSettings, savedSettings) => {
        this.setState({
          launchPackage: savedSettings.launchPackage || ''
        });
      });
    }

    this.setState({
      selectedDevice: device,
      packages: device == null ? (_expected || _load_expected()).Expect.value([]) : (_expected || _load_expected()).Expect.pendingValue([])
    });

    this._refreshPackageList(device);
  }

  _refreshPackageList(device) {
    var _this4 = this;

    return (0, _asyncToGenerator.default)(function* () {
      if (device != null) {
        const packages = (_expected || _load_expected()).Expect.value((yield _this4._adbService.getInstalledPackages(device)).sort());
        _this4.setState({
          packages
        });
      } else {
        _this4.setState({
          packages: (_expected || _load_expected()).Expect.value([])
        });
      }
    })();
  }

  _setAdbPorts(value) {
    (0, (_EmulatorUtils || _load_EmulatorUtils()).setAdbPath)(this.props.targetUri, this.state.adbPath || '');

    const parsedPorts = value.split(/,\s*/).map(port => parseInt(port.trim(), 10)).filter(port => !Number.isNaN(port));

    (0, (_EmulatorUtils || _load_EmulatorUtils()).addAdbPorts)(this.props.targetUri, parsedPorts);
    this.setState({ adbPorts: value, selectedDevice: null });
  }

  render() {
    const devicesLabel = this.state.adbPorts === '' ? '' : '(ADB port ' + this.state.adbPorts + ')';
    return _react.createElement(
      'div',
      { className: 'block' },
      _react.createElement(
        'label',
        null,
        'ADB Server Port: '
      ),
      _react.createElement((_AtomInput || _load_AtomInput()).AtomInput, {
        placeholderText: 'Optional. (For One World devices, specify ANDROID_ADB_SERVER_PORT from one_world_adb)',
        title: 'Optional. (For One World devices, specify ANDROID_ADB_SERVER_PORT from one_world_adb)',
        value: this.state.adbPorts,
        onDidChange: value => this._setAdbPorts(value)
      }),
      _react.createElement(
        'label',
        null,
        'Device: ',
        devicesLabel
      ),
      _react.createElement((_AdbDeviceSelector || _load_AdbDeviceSelector()).AdbDeviceSelector, {
        onChange: this._handleDeviceChange,
        targetUri: this.props.targetUri
      }),
      _react.createElement(
        'label',
        null,
        'Package: '
      ),
      this.state.packages.isPending ? _react.createElement((_LoadingSpinner || _load_LoadingSpinner()).LoadingSpinner, { size: 'EXTRA_SMALL' }) : _react.createElement((_Dropdown || _load_Dropdown()).Dropdown, {
        disabled: this.state.selectedDevice == null,
        options: this.state.packages.isPending || this.state.packages.isError ? [] : this.state.packages.value.map(packageName => {
          return { value: packageName, label: packageName };
        }),
        onChange: value => this.setState({ launchPackage: value }),
        value: this.state.launchPackage
      }),
      _react.createElement(
        'label',
        null,
        'Activity: '
      ),
      _react.createElement((_AtomInput || _load_AtomInput()).AtomInput, {
        placeholderText: 'com.example.app.main.MainActivity',
        value: this.state.launchActivity,
        onDidChange: value => this.setState({ launchActivity: value })
      }),
      _react.createElement(
        'label',
        null,
        'Service: '
      ),
      _react.createElement((_AtomInput || _load_AtomInput()).AtomInput, {
        placeholderText: '.example.package.path.MyServiceClass',
        value: this.state.launchService,
        onDidChange: value => this.setState({ launchService: value })
      }),
      _react.createElement(
        'label',
        null,
        'Intent: '
      ),
      _react.createElement((_AtomInput || _load_AtomInput()).AtomInput, {
        placeholderText: 'android.intent.action.MAIN',
        value: this.state.launchAction,
        onDidChange: value => this.setState({ launchAction: value })
      })
    );
  }

}
exports.AndroidLaunchComponent = AndroidLaunchComponent; /**
                                                          * Copyright (c) 2015-present, Facebook, Inc.
                                                          * All rights reserved.
                                                          *
                                                          * This source code is licensed under the license found in the LICENSE file in
                                                          * the root directory of this source tree.
                                                          *
                                                          * 
                                                          * @format
                                                          */