import React, { Component } from "react";
import PropTypes from "prop-types";
import { notify } from "react-notify-toast";

import { makeUrl } from "shared/util";
import ThemeItem from "./themes/ThemeItem";

import StyledGrid from "../../components/grid";
import { translate } from "react-i18next";

let SCROLLTOP = 0;

class Themes extends Component {
  static propTypes = {
    updateOption: PropTypes.func,
    options: PropTypes.object,
    settings: PropTypes.object,
  };

  cssRef = React.createRef();

  state = {
    css: "",
    themes: [],
    loading: true,
    theme: "",
  };

  updatedOptions = {};

  componentDidMount() {
    this.setState({ loading: true }, this.getThemes);
    document.body.classList.add("themes-page");
  }

  componentWillUnmount() {
    document.body.classList.remove("themes-page");
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    if (nextProps.settings.loading) {
      return false;
    }
    const { css, theme } = nextProps.settings;

    return {
      css: nextState.css || css.value,
      theme: theme.value,
    };
  }

  getSnapshotBeforeUpdate = (prevProps, prevState) => {
    if (typeof window === "undefined") return null;
    if (prevState.loading) return null;
    SCROLLTOP = window.scrollY;
    return null;
  };

  componentDidUpdate() {
    if (typeof window === "undefined") return null;
    window.scrollTo(0, SCROLLTOP);
  }

  getThemes = () => {
    const url = makeUrl("/admin/getThemes");
    fetch(url, { headers: { Authorization: localStorage.token } })
      .then(res => res.json())
      .then(themes => {
        this.setState({ themes, loading: false });
      });
  };

  handleCssChange = e => {
    const newState = { css: e.target.value };
    this.setState(newState);
  };

  setOption = (option, value) => {
    this.updatedOptions[option] = value;
  };

  activateTheme = async e => {
    e && e.preventDefault();
    const settings = [];
    Object.keys(this.updatedOptions).forEach(option => {
      let value = this.updatedOptions[option];
      settings.push({
        option,
        value,
      });
    });
    await this.props.updateOption(settings);
    notify.show("Theme Activated", "success", 3000);
  };

  selectTheme = (e, theme) => {
    e.preventDefault();
    if (e.target.className == "material-icons") return;
    const modifiedThemes = this.state.themes.map(items => {
      items.active = false;
      if (theme.name === items.name) {
        items.active = true;
      }
      return items;
    });
    this.updatedOptions.theme = theme.short_name;
    this.setState(
      {
        themes: modifiedThemes,
      },
      () => {
        this.activateTheme();
      },
    );
  };

  saveCss = async e => {
    e.preventDefault();
    await this.props.updateOption([{ option: "css", value: this.state.css }]);
    notify.show("CSS Saved", "success", 3000);
  };

  render() {
    return (
      <div>
        <StyledGrid columns="repeat(auto-fit,minmax(250px,1fr))">
          {this.state.themes.map((theme, idx) => (
            <ThemeItem key={idx} theme={theme} selectTheme={this.selectTheme} />
          ))}
        </StyledGrid>
      </div>
    );
  }
}

export default translate("translations")(Themes);