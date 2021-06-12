/** Settings component
 * A component that does routine work for you
 * @author Xinos#2003
 * @licence MIT
 * @version 1.4.2
 * @link https://github.com/powerfart-plugins/Settings-component
 * @docs https://github.com/powerfart-plugins/Settings-component#documentation
 * @copyright (c) 2021 Xinos
 */

const { React, getModule, constants: { DEFAULT_ROLE_COLOR } } = require('powercord/webpack');
const Components = {
  ...require('powercord/components/settings'),
  ...require('powercord/components')
};

/* eslint-disable no-undefined, object-property-newline, no-use-before-define */
// noinspection JSUnresolvedFunction,JSUnusedGlobalSymbols

class Settings extends React.Component {
  /**
   * Automatically register settings
   * @param {Object} params
   * @param {String} [params.id] by default = `entityID-settings`
   * @param {String} params.entityID
   * @param {String} [params.label] by default = entityID to titleCase
   * @param {Array} params.items
   */
  static register ({ id, entityID, label, items }) {
    id = (id) ? id : `${entityID}-settings`;
    label = (label) ? label : snake2title(entityID);

    powercord.api.settings.registerSettings(id, {
      category: entityID,
      label,
      render: (settings) => React.createElement(Settings, { ...settings, items })
    });
  }

  static Category (props) {
    const def = (props.opened === undefined) ? true : props.opened;
    const [ opened, onChange ] = React.useState(def);
    props = { ...props, onChange, opened };

    return <Components.Category {...props}/>;
  }

  constructor (props) {
    super(props);
    this.state = {}; // useState in a TabBar is suck
  }

  render () {
    return <>
      { this.renderItems(this.props.items) }
    </>;
  }

  get itemsTypes () {
    return {
      switch: this.renderSwitch,
      colorPicker: this.renderColorPicker,
      slider: this.renderSlider,
      select: this.renderSelect,
      text: this.renderText,
      radioGroup: this.renderRadioGroup,
      checkbox: this.renderCheckbox,
      category: this.renderCategory,
      tabBar: this.renderTabBar,
      button: this.renderButton
    };
  }

  renderItems (items) {
    return items.map((item, index) => {
      const ownRender = ('type' in item) ? this.itemsTypes[item.type] : null;

      if (ownRender) {
        return ownRender.call(this, item, index);
      } else if (typeof item === 'function') {
        return this._passSetting(null, item);
      }
      return null;
    });
  }

  renderSwitch (item) {
    const { key, def, onClick, name } = item;
    const { getSetting, toggleSetting } = this.props;
    const value = this._getValue(item.value);

    return (
      <Components.SwitchItem
        {...item}
        children={name}
        onChange={(v) => (onClick) ? this._passSetting(v, onClick) : toggleSetting(key, def)}
        value={(key) ? getSetting(key, def) : value}
      />
    );
  }

  renderColorPicker (item) {
    const { key, def, onChange } = item;
    const { getSetting, updateSetting } = this.props;
    const realDef = (def === undefined) ? DEFAULT_ROLE_COLOR : def;
    const value = this._getValue(item.value);

    return (
      <Components.ColorPickerInput
        {...item}
        value={(key) ? getSetting(key, realDef) : value}
        onChange={(v) => (onChange) ? this._passSetting(v, onChange) : updateSetting(key, ((v === realDef) ? null : v))}
        children={item.name}
        default={item.defaultColor}
        defaultColors={item.defaultColors}
      />
    );
  }

  renderSlider (item) {
    const { key, def, sequenceNumsUp, onChange, keyboardStep, stickToMarkers, name } = item;
    const { getSetting, updateSetting } = this.props;
    const value = this._getValue(item.value);

    if (sequenceNumsUp) {
      item.markers = Array.from(
        { length: sequenceNumsUp },
        (_, i) => i + 1
      );
    }
    return (
      <Components.SliderInput
        {...item}
        initialValue={(key) ? getSetting(key, def) : value}
        onValueChange={(v) => (onChange) ? this._passSetting(v, onChange) : updateSetting(key, v)}
        keyboardStep={(keyboardStep === undefined) ? 1 : keyboardStep}
        stickToMarkers={(stickToMarkers === undefined) ? true : stickToMarkers}
        children={name}
      />
    );
  }

  renderSelect (item) {
    const { key, def, onChange, items, name, disabled } = item;
    const { getSetting, updateSetting } = this.props;
    const value = this._getValue(item.value);

    return (
      <Components.SelectInput
        {...item}
        value={(key) ? getSetting(key, def) : value}
        onChange={(v) => (onChange) ? this._passSetting(v, onChange) : updateSetting(key, v.value)}
        disabled={(disabled) ? this._passSetting(null, disabled) : null}
        options={this._getValue(items)}
        children={name}
      />
    );
  }

  renderText (item) {
    const { key, def, name, onChange, debounce } = item;
    const { getSetting, updateSetting } = this.props;
    const value = this._getValue(item.value);
    const defaultValue = this._getValue(item.default);
    const runDebounce = (() => {
      let timer = null;
      return (callback) => {
        clearTimeout(timer);
        timer = setTimeout(callback, debounce || 250);
      };
    })();

    function TextInput2 (props) { // It is necessary to expand the functionality, so far only Errors
      const [ error, onError ] = React.useState(null);
      const newProps = {
        ...props,
        error,
        onChange: (v) => {
          onError(null);
          runDebounce(() => {
            const res = props.onChange(v);
            onError(res?.error);
          });
        }
      };

      return <Components.TextInput {...newProps}/>;
    }

    return (
      <TextInput2
        {...item}
        value={(key) ? getSetting(key, def) : value}
        defaultValue={(key) ? getSetting(key, def) : defaultValue}
        onChange={(v) => (onChange) ? this._passSetting(v, onChange) : updateSetting(key, v)}
        children={name}
      />
    );
  }

  renderRadioGroup (item) {
    const { key, def, onChange, name, items } = item;
    const { getSetting, updateSetting } = this.props;
    const value = this._getValue(item.value);

    return (
      <Components.RadioGroup
        {...item}
        value={(key) ? getSetting(key, def) : value}
        onChange={(v) => (onChange) ? this._passSetting(v, onChange) : updateSetting(key, v.value)}
        options={items}
        children={name}
      />
    );
  }

  renderCheckbox (item) {
    const { key, def, onClick, name } = item;
    const { getSetting, toggleSetting } = this.props;
    const auto = (key && (def !== undefined));

    return (
      <Components.CheckboxInput
        {...item}
        onChange={(v) => (onClick) ? this._passSetting(v, onClick) : toggleSetting(key, v)}
        value={(auto) ? getSetting(key, def) : item.value }
        children={name}
      />
    );
  }

  renderCategory (item) {
    return (
      <Settings.Category {...item}>
        {this.renderItems(item.items)}
      </Settings.Category>
    );
  }

  renderTabBar (item, index) {
    const types = getModule([ 'topPill', 'item' ], false);
    const { tabBar, tabBarItem } = getModule([ 'tabBarItem' ], false);
    const stateKey = `tabBar-${index}`;

    if (this.state[stateKey] === undefined) {
      this.state[stateKey] = '0';
      this.setState({
        [stateKey]: (item.selected === undefined) ? '0' : item.selected
      });
    }

    return (
      <div className='powercord-entities-manage powercord-text'>
        <div style={{ marginBottom: 25 }}>
          <Components.TabBar
            {...item}
            type={types.top}
            style={{ backgroundColor: 'none' }}
            className={tabBar}
            selectedItem={this.state[stateKey]}
            onItemSelect={(v) => this.setState({ [stateKey]: v })}
          >
            {
              item.items.map((item, index) => (
                <Components.TabBar.Item
                  id={String(index)}
                  selectedItem={this.state[stateKey]}
                  className={tabBarItem}
                >
                  {item.name}
                </Components.TabBar.Item>
              ))
            }
          </Components.TabBar>
        </div>
        { this.renderItems(item.items[this.state[stateKey]].items) }
      </div>
    );
  }

  renderButton (item) {
    const { onClick, name } = item;

    return (
      <Components.ButtonItem
        {...item}
        children={name}
        onClick={() => this._passSetting(null, onClick)}
      />
    );
  }

  _passSetting (value = null, handler) {
    const { getSetting, updateSetting, toggleSetting } = this.props;
    return handler({ getSetting, updateSetting, toggleSetting }, value);
  }

  _getValue (v) {
    return (typeof v === 'function') ? this._passSetting(null, v) : v;
  }
}

function snake2title (snakeCase) {
  return snakeCase
    .toLowerCase()
    .split('-')
    .map((str) => (
      str.charAt(0).toUpperCase() + str.slice(1)
    ))
    .join(' ');
}

module.exports = Settings;
