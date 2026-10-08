// TODO: write documentation for colors and palette in own markdown file and add links from here

const palette = {
  white: '#ffffff',
  white_muted: 'rgba(255, 255, 255, 0.5)',
  white_muted2: 'rgba(255, 255, 255, 0.8)',
  white_muted3: 'rgba(255, 255, 255, 0.8)',
  black: '#000000',
  black_muted: 'rgba(0, 0, 0, 0.5)',
  black_muted2: 'rgba(0, 0, 0, 0.)',
  black_65: 'rgba(0, 0, 0, 0.65)',

  dark: '#1E283C',
  grey: '#495361',
  light: '#A2A4AA',

  black_dark: '#2a2626',

  green_dark2: '#2D7E24',
  green_dark: '#379a29',
  green: '#41B530',
  green_light: '#5ec04f',

  yellow_dark: '#2A4A7D',
  yellow: '#5C8AD0',
  yellow_light: '#9EC0F0',

  red_dark: '#c92b40',
  red: '#ED334B',
  red_light: '#f05266',
  red_light2: '#f55454',

  blue_dark: '#1461d1',
  blue: '#1872F6',
  blue_light: '#c6dcfd',

  orange_dark: '#243E72',
  orange: '#345D9D',
  orange_light: '#5C8AD0',
  orange_light2: '#4A78BC',

  gold: '#9EC0F0'
};

export const colors = Object.assign({}, palette, {
  transparent: 'rgba(0, 0, 0, 0)',

  text: palette.white,
  textWhite: palette.white_muted2,

  textDim: palette.white_muted,

  background: '#070606',

  error: '#e52937',

  danger: 'rgba(245, 84, 84, 0.90)',

  card: '#262222',
  warning: palette.gold,
  primary: palette.yellow,

  bg2: '#2a2a2a',
  bg3: '#434242',
  bg4: '#383535',
  search_bar_bg: '#1E1F24',

  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255, 255, 255, 0.1)',

  icon_yellow: '#9EC0F0',

  brc20_deploy: '#233933',
  brc20_transfer: '#375e4d',
  brc20_transfer_selected: '#41B530',
  brc20_other: '#3e3e3e',

  value_up_color: '#4DA474',
  value_down_color: '#BF3F4D',

  ticker_color: '#9EC0F0',
  ticker_color2: 'rgba(255, 255, 255, 0.85)',

  success: '#7BE098',

  txid_color: '#2AB2F8',

  warning_content: '#9EC0F0D9',

  warning_bg: '#345D9D59',
  line: 'rgba(255,255,255,0.15)',
  line2: 'rgba(255,255,255,0.3)'
});

export type ColorTypes = keyof typeof colors;
