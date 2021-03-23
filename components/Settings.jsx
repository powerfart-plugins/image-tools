const { SwitchItem, TextInput, Category, ColorPickerInput, SliderInput } = require('powercord/components/settings');
const { React, getModule, i18n: { Messages }, constants: { DEFAULT_ROLE_COLOR } } = require('powercord/webpack');
const { existsSync } = require('fs');

const { hex2int, int2hex } = getModule([ 'isValidHex' ], false);
const { getDownloadPath } = require('../utils');
const imageSearchServices = require('../ReverseImageSearchEngines.json');

module.exports = class Settings extends React.PureComponent {
  constructor ({ getSetting, updateSetting }) {
    super();
    this.state = {
      errorSavePath: null
    };
    if (!getSetting('disabledImageSearchEngines')) {
      updateSetting('disabledImageSearchEngines', []);
    }
  }

  render () {
    const { getSetting, toggleSetting, updateSetting, settings } = this.props;
    const savePathSave = global._.debounce((path) => {
      if (!existsSync(path)) {
        this.setState({ errorSavePath: Messages.IMAGE_TOOLS_CANNOT_FIND_PATH });
        return;
      }
      this.setState({ errorSavePath: null });
      updateSetting('pathSave', path);
    }, 250);

    return <>
      <SwitchItem
        value={ getSetting('hideNativeButtons', true) }
        onChange={ () => toggleSetting('hideNativeButtons', true) }
        note={ Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS_NOTE }
      >{Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS}</SwitchItem>
      <SwitchItem
        value={ getSetting('patchImageSize', true) }
        onChange={ () => toggleSetting('patchImageSize', true) }
        note={ Messages.IMAGE_TOOLS_RESIZE_IMAGES_NOTE }
      >{Messages.IMAGE_TOOLS_RESIZE_IMAGES}</SwitchItem>
      <SwitchItem
        value={ getSetting('hideSuccessToasts', false) }
        onChange={ () => toggleSetting('hideSuccessToasts', false) }
        note={Messages.IMAGE_TOOLS_QUIET_EXECUTION_NOTE}
      >{Messages.IMAGE_TOOLS_QUIET_EXECUTION}</SwitchItem>
      <SwitchItem
        value={ getSetting('disableWebp', true) }
        onChange={ () => toggleSetting('disableWebp', true) }
      >{Messages.IMAGE_TOOLS_HIDE_WEBP}</SwitchItem>
      <TextInput
        defaultValue={getDownloadPath(getSetting('pathSave', null))}
        note={Messages.IMAGE_TOOLS_IMAGE_SAVING_PATH_NOTE}
        onChange={savePathSave}
        error={this.state.errorSavePath}
      >{Messages.IMAGE_TOOLS_IMAGE_SAVING_PATH}</TextInput>
      <Category
        name={Messages.IMAGE_TOOLS_LENS_SETTINGS}
        opened={true}
        onChange={() => null}
      >
        <ColorPickerInput
          value={hex2int(getSetting('lensColor', '000000'))}
          onChange={(v) => updateSetting('lensColor', (v === DEFAULT_ROLE_COLOR) ? null : int2hex(v))}
          note={Messages.IMAGE_TOOLS_LENS_BORDER_COLOR_NOTE}
        >{Messages.IMAGE_TOOLS_LENS_BORDER_COLOR}</ColorPickerInput>
        <SliderInput
          stickToMarkers
          keyboardStep= {1}
          markers={Array.from({ length: 10 }, (_, i) => (i + 1) * 5)}
          onMarkerRender={(e) => `${e}x`}
          onValueChange={(v) => updateSetting('maxZoomRatio', v)}
          defaultValue={ getSetting('maxZoomRatio', 15) }
          initialValue={ getSetting('maxZoomRatio', 15) }
          note={Messages.IMAGE_TOOLS_ZOOM_RATIO_NOTE}
        >{Messages.IMAGE_TOOLS_MAX_ZOOM_RATIO}</SliderInput>
        <SliderInput
          stickToMarkers
          keyboardStep= {1}
          markers={Array.from({ length: 10 }, (_, i) => (i + 1) * 100)}
          onMarkerRender={(e) => `${e}px`}
          onValueChange={(v) => updateSetting('maxLensRadius', v)}
          defaultValue={ getSetting('maxLensRadius', 700) }
          initialValue={ getSetting('maxLensRadius', 700) }
          note={Messages.IMAGE_TOOLS_LENS_RADIUS_NOTE}
        >{Messages.IMAGE_TOOLS_MAX_LENS_RADIUS}</SliderInput>
      </Category>
      <Category
        name={Messages.IMAGE_TOOLS_REVERSE_SEARCH_IMAGES_SERVICES}
        opened={true}
        onChange={() => null}
      >
        {
          imageSearchServices.map(({ name, note }) => (
            <SwitchItem
              value={ this.isEnableEngine(name) }
              onChange={ (v) => {
                const arr = settings.disabledImageSearchEngines;
                const id = this.getEngineId(name);

                if (v) {
                  arr.splice(arr.indexOf(id), 1);
                } else {
                  arr.push(id);
                }
                updateSetting('disabledImageSearchEngines', arr);
              }}
              note={ note }
            >{name}</SwitchItem>
          ))
        }
      </Category>
    </>;
  }

  getEngineId (name) {
    return name
      .replace(' ', '-')
      .toLowerCase();
  }

  isEnableEngine (name) {
    return !this.props.getSetting('disabledImageSearchEngines').includes(this.getEngineId(name));
  }
};
