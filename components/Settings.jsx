const { SwitchItem, TextInput, Category, ColorPickerInput, SliderInput } = require('powercord/components/settings');
const { React, getModule, i18n: { Messages }, constants: { DEFAULT_ROLE_COLOR } } = require('powercord/webpack');
const { existsSync } = require('fs');

const { hex2int, int2hex } = getModule([ 'isValidHex' ], false);
const getDownloadPath = require('../utils/getDownloadPath');
const imageSearchServices = require('../ReverseImageSearchServices.json');

module.exports = class Settings extends React.Component {
  constructor () {
    super();
    this.state = {
      errorSavePath: null
    };
  }

  render () {
    const { getSetting, toggleSetting, updateSetting, settings } = this.props;
    const savePathSave = global._.debounce((path) => {
      if (!existsSync(path)) {
        this.setState({ errorSavePath: Messages.CANNOT_FIND_PATH });
        return;
      }
      this.setState({ errorSavePath: null });
      updateSetting('pathSave', path);
    }, 250);

    if (!getSetting('disabledImageSearchServices')) {
      updateSetting('disabledImageSearchServices', []);
    }

    return <>
      <SwitchItem
        value={ getSetting('hideNativeButtons', true) }
        onChange={ () => toggleSetting('hideNativeButtons', true) }
        note={ Messages.HIDE_NATIVE_BUTTONS_NOTE }
      >{Messages.HIDE_NATIVE_BUTTONS}</SwitchItem>
      <SwitchItem
        value={ getSetting('patchImageSize', true) }
        onChange={ () => toggleSetting('patchImageSize', true) }
        note={ Messages.RESIZE_IMAGES_NOTE }
      >{Messages.RESIZE_IMAGES}</SwitchItem>
      <SwitchItem
        value={ getSetting('hideSuccessToasts', false) }
        onChange={ () => toggleSetting('hideSuccessToasts', false) }
        note={Messages.QUIET_EXECUTION_NOTE}
      >{Messages.QUIET_EXECUTION}</SwitchItem>
      <SwitchItem
        value={ getSetting('disableWebp', true) }
        onChange={ () => toggleSetting('disableWebp', true) }
      >{Messages.HIDE_WEBP}</SwitchItem>
      <TextInput
        defaultValue={getDownloadPath(getSetting('pathSave', null))}
        note={Messages.IMAGE_SAVING_PATH_NOTE}
        onChange={savePathSave}
        error={this.state.errorSavePath}
      >{Messages.IMAGE_SAVING_PATH}</TextInput>
      <Category
        name={Messages.LENS_SETTINGS}
        opened={true}
        onChange={() => null}
      >
        <ColorPickerInput
          value={hex2int(getSetting('lensColor', '000000'))}
          onChange={(v) => updateSetting('lensColor', (v === DEFAULT_ROLE_COLOR) ? null : int2hex(v))}
          note={Messages.LENS_BORDER_COLOR_NOTE}
        >{Messages.LENS_BORDER_COLOR}</ColorPickerInput>
        <SliderInput
          stickToMarkers
          keyboardStep= {1}
          markers={[ 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]}
          onMarkerRender={(e) => `${e}x`}
          onValueChange={(v) => updateSetting('zoomRatio', v)}
          defaultValue={ getSetting('zoomRatio', 1) }
          initialValue={ getSetting('zoomRatio', 1) }
          note={Messages.ZOOM_RATIO_NOTE}
        >{Messages.ZOOM_RATIO}</SliderInput>
        <SliderInput
          stickToMarkers
          keyboardStep= {1}
          markers={[ 50, 100, 200, 300, 400, 500, 600, 700 ]}
          onMarkerRender={(e) => `${e}px`}
          onValueChange={(v) => updateSetting('lensRadius', v)}
          defaultValue={ getSetting('lensRadius', 50) }
          initialValue={ getSetting('lensRadius', 50) }
          note={Messages.LENS_RADIUS_NOTE}
        >{Messages.LENS_RADIUS}</SliderInput>
        <SwitchItem
          value={ getSetting('disableAntiAliasing', false) }
          onChange={ () => toggleSetting('disableAntiAliasing', false) }
          note={ Messages.DISABLE_ANTI_ALIASING_NOTE }
        >{Messages.DISABLE_ANTI_ALIASING}</SwitchItem>
      </Category>
      <Category
        name={Messages.REVERSE_SEARCH_IMAGES_SERVICES}
        opened={true}
        onChange={() => null}
      >
        {
          imageSearchServices.map((service) => (
            <SwitchItem
              value={ !getSetting('disabledImageSearchServices').includes(service.id) }
              onChange={ (v) => {
                const arr =  settings.disabledImageSearchServices;
                if (v) {
                  arr.splice(arr.indexOf(service.id), 1);
                } else {
                  arr.push(service.id);
                }
                updateSetting('disabledImageSearchServices', arr);
              } }
              note={ service.note }
            >{service.name}</SwitchItem>
          ))
        }
      </Category>
    </>;
  }
};
