const { React, getModule, contextMenu: { closeContextMenu } } = require('powercord/webpack');
const { getOwnerInstance, waitFor } = require('powercord/util');

class ContextMenu extends React.PureComponent {
  constructor (props) { // @todo: deprecate this
    super(props);
    this.state = {};
  }

  static renderRawItems (items) {
    const cm = new ContextMenu();
    const res = cm.renderItems(items, {
      standalone: true,
      depth: 0,
      group: 0,
      i: 0
    });
    return res;
  }

  render () {
    if (this.props.items) { // Just assume we're rendering just a simple part of a context menu
      return this.renderItems(this.props.items, {
        depth: 0,
        group: 0,
        i: 0
      });
    }

    const { default: Menu, MenuGroup } = getModule([ 'MenuGroup' ], false);
    return (
      <Menu
        navId={this.props.navId || `pc-${Math.random().toString(32).slice(2)}`}
        onClose={closeContextMenu}
      >
        {this.props.itemGroups.map((items, i) => (
          <MenuGroup>
            {this.renderItems(items, {
              depth: 0,
              group: i,
              i: 0
            })}
          </MenuGroup>
        ))}
      </Menu>
    );
  }

  renderItems (items, ctx) {
    return items.map(item => {
      ctx.i++;
      switch (item.type) {
        case 'button':
          return this.renderButton(item, ctx);

        case 'checkbox':
          return this.renderCheckbox(item, ctx);

        case 'slider':
          return this.renderSlider(item, ctx);

        case 'submenu':
          return this.renderSubMenu(item, ctx);

        default:
          return null;
      }
    });
  }

  renderButton (item, ctx) {
    const { MenuItem } = getModule([ 'MenuGroup' ], false);
    return (
      <MenuItem
        id={item.id || `item-${ctx.group}-${ctx.depth}-${ctx.i}`}
        disabled={item.disabled}
        label={item.name}
        color={item.color}
        hint={item.hint}
        subtext={item.subtext}
        action={() => {
          if (item.disabled) {
            waitFor('#app-mount > div[class] > div').then(app => getOwnerInstance(app).shake(600, 5));
          } else if (item.onClick) {
            item.onClick();
          }
        }}
      />
    );
  }

  renderCheckbox (item, ctx) {
    const { MenuCheckboxItem } = getModule([ 'MenuGroup' ], false);
    const elementKey = `active-${ctx.group}-${ctx.depth}-${ctx.i}`;
    const isStandalone = !!ctx.standalone;
    const active = this.state[elementKey] !== void 0
      ? this.state[elementKey]
      : item.defaultState;

    return (
      <MenuCheckboxItem
        id={item.id || `item-${ctx.group}-${ctx.depth}-${ctx.i}`}
        checked={active}
        label={item.name}
        color={item.color}
        hint={item.hint}
        subtext={item.subtext}
        action={e => {
          const newActive = !active;
          if (item.onToggle) {
            item.onToggle(newActive);
          }
          if (isStandalone) {
            const el = e.target.closest('[role="menu"]');
            setImmediate(() => getOwnerInstance(el).forceUpdate());
          } else {
            this.setState({ [elementKey]: newActive });
          }
        }}
      />
    );
  }

  renderSlider (item, ctx) {
    const { MenuControlItem } = getModule([ 'MenuGroup' ], false);
    const Slider = getModule(m => m.render && m.render.toString().includes('sliderContainer'), false);
    return (
      <MenuControlItem
        id={item.id || `item-${ctx.group}-${ctx.depth}-${ctx.i}`}
        label={item.name}
        color={item.color}
        hint={item.hint}
        subtext={item.subtext}
        control={(props, ref) => <Slider
          mini
          ref={ref}
          equidistant={typeof item.markers !== 'undefined'}
          stickToMarkers={typeof item.markers !== 'undefined'}
          {...props}
          {...item}
        />}
      />
    );
  }

  renderSubMenu (item, ctx) {
    const { MenuItem } = getModule([ 'MenuGroup' ], false);
    const elementKey = `items-${ctx.group}-${ctx.depth}-${ctx.i}`;
    let items = this.state[elementKey];
    if (items === void 0) {
      items = item.getItems();
      this.setState({ [elementKey]: items });
      if (items instanceof Promise) {
        items.then(fetchedItems => this.setState({ [elementKey]: fetchedItems }));
      }
    }
    return (
      <MenuItem
        id={item.id || `item-${ctx.group}-${ctx.depth}-${ctx.i}`}
        disabled={!items || items instanceof Promise || items.length === 0 || item.disabled}
        label={item.name}
        color={item.color}
        hint={item.hint}
        subtext={item.subtext}
      >
        {items && !(items instanceof Promise) && items.length !== 0 && !item.disabled && this.renderItems(items, {
          depth: ctx.depth + 1,
          group: 0,
          i: 0
        })}
      </MenuItem>
    );
  }
}

module.exports = ContextMenu;
