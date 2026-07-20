import chalk from "chalk";

export const theme = {
  primary: chalk.hex("#D4A017"),
  secondary: chalk.hex("#2A9D8F"),
  accent: chalk.hex("#E76F51"),
  success: chalk.hex("#52B788"),
  warning: chalk.hex("#F4A261"),
  error: chalk.hex("#E63946"),
  info: chalk.hex("#4895EF"),
  muted: chalk.hex("#8D99AE"),
  white: chalk.hex("#F8F9FA"),
  surface: chalk.hex("#2B2D42"),
  background: chalk.hex("#1A1B2E"),
  border: chalk.hex("#3D405B"),
  highlight: chalk.hex("#F4D03F"),
  link: chalk.hex("#64B5F6"),
  subtle: chalk.hex("#6C757D"),
};

export const styles = {
  heading: chalk.hex("#D4A017").bold,
  subheading: chalk.hex("#2A9D8F").bold,
  label: chalk.hex("#8D99AE"),
  value: chalk.hex("#F8F9FA"),
  dim: chalk.hex("#6C757D"),
  code: chalk.hex("#F4D03F"),
  path: chalk.hex("#64B5F6").italic,
  number: chalk.hex("#E76F51"),
  keyword: chalk.hex("#2A9D8F").bold,
  bracket: chalk.hex("#8D99AE"),
};

export const severity = {
  critical: chalk.bgHex("#E63946").hex("#FFFFFF").bold,
  high: chalk.hex("#E63946").bold,
  medium: chalk.hex("#F4A261").bold,
  low: chalk.hex("#4895EF"),
  info: chalk.hex("#8D99AE"),
  success: chalk.hex("#52B788").bold,
};
