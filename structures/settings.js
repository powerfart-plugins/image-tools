const { React } = require('powercord/webpack');

const buttonStructure = require('./button.js');
const imageSearchServices = require('../ReverseImageSearchEngines.json');

const SaveDirs = require('../components/SaveDirs.jsx');
const SettingsRender = require('../components/SettingsRender.jsx');

module.exports = function () {
  const { i18n: { Messages } } = require('powercord/webpack');

  return [
    {
      type: 'tabBar',
      items: [
        {
          name: Messages.IMAGE_TOOLS_GENERAL_SETTINGS,
          items: [
            {
              type: 'switch',
              name: Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS,
              note: Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS_NOTE,
              key: 'hideNativeButtons',
              def: true
            },
            {
              type: 'switch',
              name: Messages.IMAGE_TOOLS_RESIZE_IMAGES,
              note: Messages.IMAGE_TOOLS_RESIZE_IMAGES_NOTE,
              key: 'patchImageSize',
              def: true
            }
          ]
        },
        {
          name: Messages.IMAGE_TOOLS_LENS_SETTINGS,
          items: [
            {
              type: 'colorPicker',
              name: Messages.IMAGE_TOOLS_LENS_BORDER_COLOR,
              note: Messages.IMAGE_TOOLS_LENS_BORDER_COLOR_NOTE,
              key: 'lensColor'
            },
            {
              type: 'slider',
              name: Messages.IMAGE_TOOLS_MAX_ZOOM_RATIO,
              note: Messages.IMAGE_TOOLS_ZOOM_RATIO_NOTE,
              key: 'maxZoomRatio',
              def: 15,
              markers: Array.from({ length: 10 }, (_, i) => (i + 1) * 5),
              onMarkerRender: (e) => `${e}x`
            },
            {
              type: 'slider',
              name: Messages.IMAGE_TOOLS_MAX_LENS_RADIUS,
              note: Messages.IMAGE_TOOLS_LENS_RADIUS_NOTE,
              key: 'maxLensRadius',
              def: 700,
              markers: Array.from({ length: 10 }, (_, i) => (i + 1) * 100),
              onMarkerRender: (e) => `${e}px`
            }
          ]
        },
        {
          name: Messages.IMAGE_TOOLS_CONTEXT_MENU_SETTINGS,
          items: [
            {
              type: 'switch',
              name: Messages.IMAGE_TOOLS_QUIET_EXECUTION,
              note: Messages.IMAGE_TOOLS_QUIET_EXECUTION_NOTE,
              key: 'hideSuccessToasts',
              def: false
            },
            {
              type: 'switch',
              name: Messages.IMAGE_TOOLS_HIDE_HINTS,
              note: Messages.IMAGE_TOOLS_HIDE_HINTS_NOTE,
              key: 'hideHints',
              def: false
            },
            {
              type: 'switch',
              name: Messages.IMAGE_TOOLS_HIDE_WEBP,
              key: 'disableWebp',
              def: true
            },
            {
              type: 'select',
              name: Messages.IMAGE_TOOLS_DEFAULT_ACTION,
              note: Messages.IMAGE_TOOLS_DEFAULT_ACTION_NOTE,
              key: 'defaultAction',
              def: 'open-image',
              items: buttonStructure
                .filter(({ type }) => type === 'button')
                .map(({ id, keyName }) => ({
                  label: Messages[keyName],
                  value: id
                }))
            },
            (props) => React.createElement(SaveDirs, props),
            (props) => React.createElement(SettingsRender.Category, {
              opened: false,
              name: Messages.IMAGE_TOOLS_REVERSE_SEARCH_IMAGES_SERVICES,
              children: React.createElement(SettingsRender, {
                ...props,
                items: [
                  ...imageSearchServices.map(({ name, note }) => {
                    const id = name.toLowerCase().replace(' ', '-');
                    return {
                      type: 'switch',
                      name,
                      note,
                      value: ({ getSetting }) => !getSetting('disabledImageSearchEngines', []).includes(id),
                      onClick: ({ getSetting, updateSetting }, v) => {
                        const arr = getSetting('disabledImageSearchEngines', []);
                        if (v) {
                          arr.splice(arr.indexOf(id), 1);
                        } else {
                          arr.push(id);
                        }
                        updateSetting('disabledImageSearchEngines', arr);
                      }
                    };
                  })
                ]
              })
            }),
            (props) => React.createElement(SettingsRender.Category, {
              opened: false,
              name: Messages.IMAGE_TOOLS_CONTEXT_MENU_ACTIONS,
              children: React.createElement(SettingsRender, {
                ...props,
                items: [
                  ...buttonStructure.map(({ id, keyName }) => (
                    {
                      type: 'switch',
                      name: Messages[keyName],
                      value: ({ getSetting }) => !getSetting('disabledActions', []).includes(id),
                      onClick: ({ getSetting, updateSetting }, v) => {
                        const arr = getSetting('disabledActions', []);
                        if (v) {
                          arr.splice(arr.indexOf(id), 1);
                        } else {
                          arr.push(id);
                        }
                        updateSetting('disabledActions', arr);
                      }
                    }
                  ))
                ]
              })
            })
          ]
        }
      ]
    }
  ];
};
