import { createTheme } from '@aws-amplify/ui-react'

// The login card is a ticket: yellow paper with ink content, identical in light
// and dark mode (the ThemeProvider stays on colorMode="light"). Only our page
// around it darkens. Values mirror the Claim ticket tokens in src/index.css.
const ink = '#22223B'
const inkHover = '#3A3A5C'
const carbon = '#4A4D5E' // 5.5:1 on ticket yellow
const ticket = '#FFCB3D'
const white = '#FFFFFF'
const inkWash = 'rgb(34 34 59 / 0.1)'
const font = '"Instrument Sans Variable", system-ui, sans-serif'

export const amplifyTheme = createTheme({
  name: 'zeptourl',
  tokens: {
    fonts: {
      default: {
        variable: { value: font },
        static: { value: font },
      },
    },
    colors: {
      brand: {
        primary: {
          10: { value: '#E9E9EF' },
          20: { value: '#D3D3DE' },
          40: { value: '#7A7E91' },
          60: { value: '#4A4D5E' },
          80: { value: ink },
          90: { value: '#17172A' },
          100: { value: '#0F0F1C' },
        },
      },
      font: {
        primary: { value: ink },
        secondary: { value: carbon },
        tertiary: { value: carbon },
        interactive: { value: ink },
      },
      border: {
        primary: { value: carbon },
        secondary: { value: carbon },
        focus: { value: ink },
      },
    },
    radii: {
      small: { value: '4px' },
      medium: { value: '6px' },
      large: { value: '8px' },
    },
    components: {
      authenticator: {
        router: {
          backgroundColor: { value: ticket },
          borderColor: { value: ink },
          borderWidth: { value: '1.5px' },
          boxShadow: { value: 'none' },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: ink },
          color: { value: white },
          _hover: { backgroundColor: { value: inkHover }, color: { value: white } },
          _focus: { backgroundColor: { value: ink }, color: { value: white } },
          _active: { backgroundColor: { value: ink }, color: { value: white } },
        },
        link: {
          color: { value: ink },
          _hover: { color: { value: ink }, backgroundColor: { value: inkWash } },
          _focus: { color: { value: ink }, backgroundColor: { value: inkWash } },
          _active: { color: { value: ink }, backgroundColor: { value: inkWash } },
        },
      },
      fieldcontrol: {
        color: { value: ink },
        borderColor: { value: carbon },
        _focus: {
          borderColor: { value: ink },
          boxShadow: { value: `0 0 0 2px ${ink}` },
        },
      },
      field: {
        label: { color: { value: ink } },
      },
      tabs: {
        borderColor: { value: carbon },
        item: {
          color: { value: carbon },
          borderColor: { value: 'transparent' },
          _hover: { color: { value: ink } },
          _focus: { color: { value: ink } },
          _active: {
            color: { value: ink },
            borderColor: { value: ink },
            backgroundColor: { value: 'transparent' },
          },
        },
      },
    },
  },
})
