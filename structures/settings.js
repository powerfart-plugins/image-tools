const { React, i18n: { Messages } } = require('powercord/webpack');

const buttonStructure = require('./button.js');
const imageSearchServices = require('../ReverseImageSearchEngines.json');

const SaveDirs = require('../components/SaveDirs.jsx');
const SettingsRender = require('../components/SettingsRender.jsx');

/* eslint-disable brace-style */
module.exports = [
  {
    type: 'tabBar',
    items: [
      {
        get name () { return Messages.IMAGE_TOOLS_GENERAL_SETTINGS; },
        items: [
          {
            type: 'switch',
            get name () { return Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS; },
            get note () { return Messages.IMAGE_TOOLS_HIDE_NATIVE_BUTTONS_NOTE; },
            key: 'hideNativeButtons',
            def: true
          },
          {
            type: 'switch',
            get name () { return Messages.IMAGE_TOOLS_RESIZE_IMAGES; },
            get note () { return Messages.IMAGE_TOOLS_RESIZE_IMAGES_NOTE; },
            key: 'patchImageSize',
            def: true
          },
          {
            type: 'slider',
            get name () { return Messages.IMAGE_TOOLS_COMPRESSION; },
            get note () { return Messages.IMAGE_TOOLS_COMPRESSION_NOTE; },
            key: 'compression',
            def: 1,
            markers: Array.from({ length: 10 }, (_, i) => ((i + 1) / 10)),
            onMarkerRender: (e) => `${e * 100}%`
          }
        ]
      },
      {
        get name () { return Messages.IMAGE_TOOLS_LENS_SETTINGS; },
        items: [
          {
            type: 'switch',
            get name () { return Messages.IMAGE_TOOLS_OFF_SCROLLING_OUTSIDE; },
            get note () { return Messages.IMAGE_TOOLS_OFF_SCROLLING_OUTSIDE_NOTE; },
            key: 'offScrollingOutside',
            def: false
          },
          {
            type: 'colorPicker',
            get name () { return Messages.IMAGE_TOOLS_LENS_BORDER_COLOR; },
            get note () { return Messages.IMAGE_TOOLS_LENS_BORDER_COLOR_NOTE; },
            key: 'lensColor'
          },
          {
            type: 'slider',
            get name () { return Messages.IMAGE_TOOLS_MAX_ZOOM_RATIO; },
            get note () { return Messages.IMAGE_TOOLS_ZOOM_RATIO_NOTE; },
            key: 'maxZoomRatio',
            def: 15,
            markers: Array.from({ length: 10 }, (_, i) => (i + 1) * 5),
            onMarkerRender: (e) => `${e}x`
          },
          {
            type: 'slider',
            get name () { return Messages.IMAGE_TOOLS_MAX_LENS_RADIUS; },
            get note () { return Messages.IMAGE_TOOLS_LENS_RADIUS_NOTE; },
            key: 'maxLensRadius',
            def: 700,
            markers: Array.from({ length: 10 }, (_, i) => (i + 1) * 100),
            onMarkerRender: (e) => `${e}px`
          }
        ]
      },
      {
        get name () { return Messages.IMAGE_TOOLS_CONTEXT_MENU_SETTINGS; },
        items: [
          {
            type: 'switch',
            get name () { return Messages.IMAGE_TOOLS_QUIET_EXECUTION; },
            get note () { return Messages.IMAGE_TOOLS_QUIET_EXECUTION_NOTE; },
            key: 'hideSuccessToasts',
            def: false
          },
          {
            type: 'switch',
            get name () { return Messages.IMAGE_TOOLS_HIDE_HINTS; },
            get note () { return Messages.IMAGE_TOOLS_HIDE_HINTS_NOTE; },
            key: 'hideHints',
            def: false
          },
          {
            type: 'select',
            get name () { return Messages.IMAGE_TOOLS_DEFAULT_ACTION; },
            get note () { return Messages.IMAGE_TOOLS_DEFAULT_ACTION_NOTE; },
            key: 'defaultAction',
            def: 'open-image',
            items: buttonStructure
              .filter(({ type }) => type === 'button')
              .map(({ id, name }) => ({
                label: name,
                value: id
              }))
          },
          (props) => React.createElement(SaveDirs, props),
          (props) => React.createElement(SettingsRender.Category, {
            opened: false,
            get name () { return Messages.IMAGE_TOOLS_LOW_PRIORITY; },
            get description () { return Messages.IMAGE_TOOLS_LOW_PRIORITY_NOTE; },
            children: React.createElement(SettingsRender, {
              ...props,
              items: [
                ...[ 'webp', 'jpg', 'gif', 'png', 'mp4' ].map((e) => ({
                  type: 'switch',
                  name: e.toUpperCase(),
                  value: ({ getSetting }) => !getSetting('lowPriorityExtensions', []).includes(e),
                  onClick: ({ getSetting, updateSetting }, v) => {
                    const arr = getSetting('lowPriorityExtensions', []);
                    if (v) {
                      arr.splice(arr.indexOf(e), 1);
                    } else {
                      arr.push(e);
                    }
                    updateSetting('lowPriorityExtensions', arr);
                  }
                }))
              ]
            })
          }),
          (props) => React.createElement(SettingsRender.Category, {
            opened: false,
            get name () { return Messages.IMAGE_TOOLS_REVERSE_SEARCH_IMAGES_SERVICES; },
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
            get name () { return Messages.IMAGE_TOOLS_CONTEXT_MENU_ACTIONS; },
            children: React.createElement(SettingsRender, {
              ...props,
              items: [
                ...buttonStructure.map(({ id, name }) => (
                  {
                    type: 'switch',
                    name,
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
